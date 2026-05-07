import test from 'node:test';
import assert from 'node:assert/strict';

import { AccountService } from '../application/fin/account-service.ts';
import { AccountBalanceService } from '../application/fin/balance-service.ts';
import { LedgerService } from '../application/fin/ledger-service.ts';
import { TransactionService } from '../application/fin/transaction-service.ts';
import { PaymentService } from '../application/procurement/payment-service.ts';
import { VendorBankAccountService } from '../application/procurement/vendor-bank-account-service.ts';
import { VendorService } from '../application/procurement/vendor-service.ts';
import { MemoryAccountRepository } from '../infrastructure/persistence/memory/memory-account-repository.ts';
import { MemoryBankRepository } from '../infrastructure/persistence/memory/memory-bank-repository.ts';
import { MemoryLedgerRepository } from '../infrastructure/persistence/memory/memory-ledger-repository.ts';
import { MemoryPaymentOrderRepository } from '../infrastructure/persistence/memory/memory-payment-order-repository.ts';
import { createMemorySeedData } from '../infrastructure/persistence/memory/seed.ts';
import { MemoryTransactionRepository } from '../infrastructure/persistence/memory/memory-transaction-repository.ts';
import { MemoryVendorBankAccountRepository } from '../infrastructure/persistence/memory/memory-vendor-bank-account-repository.ts';
import { MemoryVendorRepository } from '../infrastructure/persistence/memory/memory-vendor-repository.ts';
import { AppError } from '../shared/errors.ts';

function createServices() {
  const seed = createMemorySeedData();
  const bankRepository = new MemoryBankRepository(seed.banks);
  const ledgerRepository = new MemoryLedgerRepository(seed.ledgers);
  const accountRepository = new MemoryAccountRepository(seed.accounts);
  const transactionRepository = new MemoryTransactionRepository(seed.transactions);
  const vendorRepository = new MemoryVendorRepository(seed.vendors);
  const vendorBankAccountRepository = new MemoryVendorBankAccountRepository(
    seed.vendorBankAccounts,
  );
  const paymentOrderRepository = new MemoryPaymentOrderRepository(seed.payments);
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
    vendorService: new VendorService(
      vendorRepository,
      vendorBankAccountRepository,
      paymentOrderRepository,
    ),
    vendorBankAccountService: new VendorBankAccountService(
      vendorBankAccountRepository,
      vendorRepository,
      paymentOrderRepository,
    ),
    paymentService: new PaymentService(
      paymentOrderRepository,
      vendorRepository,
      vendorBankAccountRepository,
      accountRepository,
      transactionRepository,
      transactionService,
    ),
  };
}

test('executing a draft payment order creates a posted finance transaction and updates balances', async () => {
  const { accountService, paymentService, transactionService } = createServices();

  const beforeAccounts = await accountService.list({
    ledgerId: 'ledger_cn_main',
    limit: 50,
  });
  const cashBefore = beforeAccounts.data.find((account) => account.id === 'acct_cash_main');
  const expenseBefore = beforeAccounts.data.find(
    (account) => account.id === 'acct_expense_office',
  );

  assert.equal(cashBefore?.balance, 50000);
  assert.equal(expenseBefore?.balance, 0);

  const paymentsBefore = await paymentService.list({ limit: 20 });
  const seededPayment = paymentsBefore.data.find(
    (payment) => payment.paymentOrderNo === 'PMT-0001',
  );

  assert.ok(seededPayment);
  assert.equal(seededPayment?.status, 'DRAFT');

  const executed = await paymentService.execute(seededPayment!.id);

  assert.equal(executed.status, 'EXECUTED');
  assert.equal(executed.transactionStatus, 'POSTED');
  assert.ok(executed.transactionCode);

  await assert.rejects(
    () => paymentService.execute(seededPayment!.id),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, 'PAYMENT_ORDER_NOT_EXECUTABLE');
      return true;
    },
  );

  const afterAccounts = await accountService.list({
    ledgerId: 'ledger_cn_main',
    limit: 50,
  });
  const cashAfter = afterAccounts.data.find((account) => account.id === 'acct_cash_main');
  const expenseAfter = afterAccounts.data.find(
    (account) => account.id === 'acct_expense_office',
  );

  assert.equal(cashAfter?.balance, 46800);
  assert.equal(expenseAfter?.balance, 3200);

  const transactions = await transactionService.list({ limit: 20 });
  const paymentTransaction = transactions.data.find(
    (transaction) => transaction.referenceNo === 'PMT-DEMO-001',
  );

  assert.ok(paymentTransaction);
  assert.equal(paymentTransaction?.status, 'POSTED');
  assert.equal(paymentTransaction?.type, 'PAYMENT');
});


test('creating a payment rejects invalid account categories', async () => {
  const { paymentService } = createServices();

  await assert.rejects(
    () =>
      paymentService.create({
        vendorId: 'vendor_delta_supply',
        vendorBankAccountId: 'vendor_bank_delta_default',
        payFromAccountId: 'acct_equity_capital',
        expenseAccountId: 'acct_expense_office',
        amount: 800,
        currency: 'CNY',
        purpose: 'Should fail for non-asset pay-from account',
        paymentDate: '2026-04-16',
        referenceNo: 'PMT-TYPE-001',
        description: 'Invalid pay-from account category',
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, 'PAYMENT_PAY_FROM_ACCOUNT_INVALID');
      return true;
    },
  );

  await assert.rejects(
    () =>
      paymentService.create({
        vendorId: 'vendor_delta_supply',
        vendorBankAccountId: 'vendor_bank_delta_default',
        payFromAccountId: 'acct_cash_main',
        expenseAccountId: 'acct_equity_capital',
        amount: 800,
        currency: 'CNY',
        purpose: 'Should fail for non-expense expense account',
        paymentDate: '2026-04-16',
        referenceNo: 'PMT-TYPE-002',
        description: 'Invalid expense account category',
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, 'PAYMENT_EXPENSE_ACCOUNT_INVALID');
      return true;
    },
  );
});
