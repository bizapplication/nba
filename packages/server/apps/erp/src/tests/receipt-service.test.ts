import test from 'node:test';
import assert from 'node:assert/strict';

import { AccountService } from '../application/fin/account-service.ts';
import { AccountBalanceService } from '../application/fin/balance-service.ts';
import { LedgerService } from '../application/fin/ledger-service.ts';
import { TransactionService } from '../application/fin/transaction-service.ts';
import { CustomerBankAccountService } from '../application/crm/customer-bank-account-service.ts';
import { CustomerService } from '../application/crm/customer-service.ts';
import { ReceiptService } from '../application/crm/receipt-service.ts';
import { MemoryAccountRepository } from '../infrastructure/persistence/memory/memory-account-repository.ts';
import { MemoryBankRepository } from '../infrastructure/persistence/memory/memory-bank-repository.ts';
import { MemoryCustomerBankAccountRepository } from '../infrastructure/persistence/memory/memory-customer-bank-account-repository.ts';
import { MemoryCustomerRepository } from '../infrastructure/persistence/memory/memory-customer-repository.ts';
import { MemoryLedgerRepository } from '../infrastructure/persistence/memory/memory-ledger-repository.ts';
import { MemoryReceiptOrderRepository } from '../infrastructure/persistence/memory/memory-receipt-order-repository.ts';
import { createMemorySeedData } from '../infrastructure/persistence/memory/seed.ts';
import { MemoryTransactionRepository } from '../infrastructure/persistence/memory/memory-transaction-repository.ts';
import { AppError } from '../shared/errors.ts';

function createServices() {
  const seed = createMemorySeedData();
  const bankRepository = new MemoryBankRepository(seed.banks);
  const ledgerRepository = new MemoryLedgerRepository(seed.ledgers);
  const accountRepository = new MemoryAccountRepository(seed.accounts);
  const transactionRepository = new MemoryTransactionRepository(seed.transactions);
  const customerRepository = new MemoryCustomerRepository(seed.customers);
  const customerBankAccountRepository = new MemoryCustomerBankAccountRepository(
    seed.customerBankAccounts,
  );
  const receiptOrderRepository = new MemoryReceiptOrderRepository(seed.receipts);
  const balanceService = new AccountBalanceService(transactionRepository);
  const transactionService = new TransactionService(
    transactionRepository,
    ledgerRepository,
    accountRepository,
  );

  return {
    ledgerService: new LedgerService(
      ledgerRepository,
      bankRepository,
      accountRepository,
      transactionRepository,
    ),
    accountService: new AccountService(
      accountRepository,
      ledgerRepository,
      transactionRepository,
      balanceService,
    ),
    transactionService,
    customerService: new CustomerService(
      customerRepository,
      customerBankAccountRepository,
      receiptOrderRepository,
    ),
    customerBankAccountService: new CustomerBankAccountService(
      customerBankAccountRepository,
      customerRepository,
      receiptOrderRepository,
    ),
    receiptService: new ReceiptService(
      receiptOrderRepository,
      customerRepository,
      customerBankAccountRepository,
      accountRepository,
      transactionRepository,
      transactionService,
    ),
  };
}

test('executing a draft receipt order creates a posted finance transaction and updates balances', async () => {
  const { accountService, receiptService, transactionService } = createServices();

  const beforeAccounts = await accountService.list({
    ledgerId: 'ledger_cn_main',
    limit: 50,
  });
  const cashBefore = beforeAccounts.data.find((account) => account.id === 'acct_cash_main');
  const revenueBefore = beforeAccounts.data.find(
    (account) => account.id === 'acct_revenue_service',
  );

  assert.equal(cashBefore?.balance, 50000);
  assert.equal(revenueBefore?.balance, 0);

  const receiptsBefore = await receiptService.list({ limit: 20 });
  const seededReceipt = receiptsBefore.data.find(
    (receipt) => receipt.receiptOrderNo === 'RCT-0001',
  );

  assert.ok(seededReceipt);
  assert.equal(seededReceipt?.status, 'DRAFT');

  const executed = await receiptService.execute(seededReceipt!.id);

  assert.equal(executed.status, 'EXECUTED');
  assert.equal(executed.transactionStatus, 'POSTED');
  assert.ok(executed.transactionCode);

  await assert.rejects(
    () => receiptService.execute(seededReceipt!.id),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, 'RECEIPT_ORDER_NOT_EXECUTABLE');
      return true;
    },
  );

  const afterAccounts = await accountService.list({
    ledgerId: 'ledger_cn_main',
    limit: 50,
  });
  const cashAfter = afterAccounts.data.find((account) => account.id === 'acct_cash_main');
  const revenueAfter = afterAccounts.data.find(
    (account) => account.id === 'acct_revenue_service',
  );

  assert.equal(cashAfter?.balance, 56800);
  assert.equal(revenueAfter?.balance, 6800);

  const transactions = await transactionService.list({ limit: 20 });
  const receiptTransaction = transactions.data.find(
    (transaction) => transaction.referenceNo === 'RCT-DEMO-001',
  );

  assert.ok(receiptTransaction);
  assert.equal(receiptTransaction?.status, 'POSTED');
  assert.equal(receiptTransaction?.type, 'RECEIPT');
});
