import test from 'node:test';
import assert from 'node:assert/strict';

import { AccountService } from '../application/fin/account-service.ts';
import { AccountBalanceService } from '../application/fin/balance-service.ts';
import { LedgerService } from '../application/fin/ledger-service.ts';
import { TransactionService } from '../application/fin/transaction-service.ts';
import { MemoryAccountRepository } from '../infrastructure/persistence/memory/memory-account-repository.ts';
import { MemoryBankRepository } from '../infrastructure/persistence/memory/memory-bank-repository.ts';
import { MemoryLedgerRepository } from '../infrastructure/persistence/memory/memory-ledger-repository.ts';
import { MemoryTransactionRepository } from '../infrastructure/persistence/memory/memory-transaction-repository.ts';
import { createMemorySeedData } from '../infrastructure/persistence/memory/seed.ts';
import { AppError } from '../shared/errors.ts';

function createServices() {
  const seed = createMemorySeedData();
  const bankRepository = new MemoryBankRepository(seed.banks);
  const ledgerRepository = new MemoryLedgerRepository(seed.ledgers);
  const accountRepository = new MemoryAccountRepository(seed.accounts);
  const transactionRepository = new MemoryTransactionRepository(seed.transactions);
  const balanceService = new AccountBalanceService(transactionRepository);

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
    transactionService: new TransactionService(
      transactionRepository,
      ledgerRepository,
      accountRepository,
    ),
  };
}

test('posting a pending transaction updates balances and blocks repeated posting', async () => {
  const { accountService, transactionService } = createServices();

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

  const created = await transactionService.create({
    type: 'PAYMENT',
    amount: 800,
    debitAccountId: 'acct_expense_office',
    creditAccountId: 'acct_cash_main',
    ledgerId: 'ledger_cn_main',
    transactionDate: '2026-03-25',
    referenceNo: 'PAY-TEST-001',
    description: 'Test office payment',
  });

  assert.equal(created.status, 'PENDING');

  const posted = await transactionService.post(created.id);
  assert.equal(posted.status, 'POSTED');

  await assert.rejects(
    () => transactionService.post(created.id),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, 'TRANSACTION_ALREADY_POSTED');
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

  assert.equal(cashAfter?.balance, 49200);
  assert.equal(expenseAfter?.balance, 800);
});

test('unposting a posted transaction removes its balance effect by moving it to CANCELLED', async () => {
  const { accountService, transactionService } = createServices();

  const created = await transactionService.create({
    type: 'PAYMENT',
    amount: 300,
    debitAccountId: 'acct_expense_office',
    creditAccountId: 'acct_cash_main',
    ledgerId: 'ledger_cn_main',
    transactionDate: '2026-03-26',
    referenceNo: 'PAY-TEST-002',
    description: 'Test cancellation',
  });

  await transactionService.post(created.id);
  const cancelled = await transactionService.unpost(created.id);
  assert.equal(cancelled.status, 'CANCELLED');

  const accounts = await accountService.list({
    ledgerId: 'ledger_cn_main',
    limit: 50,
  });
  const cash = accounts.data.find((account) => account.id === 'acct_cash_main');
  const expense = accounts.data.find((account) => account.id === 'acct_expense_office');

  assert.equal(cash?.balance, 50000);
  assert.equal(expense?.balance, 0);
});
