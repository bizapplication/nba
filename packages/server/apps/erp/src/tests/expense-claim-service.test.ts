import test from 'node:test';
import assert from 'node:assert/strict';

import { AccountService } from '../application/fin/account-service.ts';
import { AccountBalanceService } from '../application/fin/balance-service.ts';
import { TransactionService } from '../application/fin/transaction-service.ts';
import { ExpenseClaimService } from '../application/hr/expense-claim-service.ts';
import { PaymentService } from '../application/procurement/payment-service.ts';
import { MemoryAccountRepository } from '../infrastructure/persistence/memory/memory-account-repository.ts';
import { MemoryBankRepository } from '../infrastructure/persistence/memory/memory-bank-repository.ts';
import { MemoryDepartmentRepository } from '../infrastructure/persistence/memory/memory-department-repository.ts';
import { MemoryEmployeeRepository } from '../infrastructure/persistence/memory/memory-employee-repository.ts';
import { MemoryEmploymentRepository } from '../infrastructure/persistence/memory/memory-employment-repository.ts';
import { MemoryExpenseClaimRepository } from '../infrastructure/persistence/memory/memory-expense-claim-repository.ts';
import { MemoryLedgerRepository } from '../infrastructure/persistence/memory/memory-ledger-repository.ts';
import { MemoryPaymentOrderRepository } from '../infrastructure/persistence/memory/memory-payment-order-repository.ts';
import { createMemorySeedData } from '../infrastructure/persistence/memory/seed.ts';
import { MemoryTransactionRepository } from '../infrastructure/persistence/memory/memory-transaction-repository.ts';
import { MemoryVendorBankAccountRepository } from '../infrastructure/persistence/memory/memory-vendor-bank-account-repository.ts';
import { MemoryVendorRepository } from '../infrastructure/persistence/memory/memory-vendor-repository.ts';

function createServices() {
  const seed = createMemorySeedData();
  const bankRepository = new MemoryBankRepository(seed.banks);
  const ledgerRepository = new MemoryLedgerRepository(seed.ledgers);
  const accountRepository = new MemoryAccountRepository(seed.accounts);
  const transactionRepository = new MemoryTransactionRepository(seed.transactions);
  const paymentOrderRepository = new MemoryPaymentOrderRepository(seed.payments);
  const vendorRepository = new MemoryVendorRepository(seed.vendors);
  const vendorBankAccountRepository = new MemoryVendorBankAccountRepository(
    seed.vendorBankAccounts,
  );
  const departmentRepository = new MemoryDepartmentRepository(seed.departments);
  const employeeRepository = new MemoryEmployeeRepository(seed.employees);
  const employmentRepository = new MemoryEmploymentRepository(seed.employments);
  const expenseClaimRepository = new MemoryExpenseClaimRepository(seed.expenseClaims);
  const balanceService = new AccountBalanceService(transactionRepository);
  const transactionService = new TransactionService(
    transactionRepository,
    ledgerRepository,
    accountRepository,
  );

  return {
    accountService: new AccountService(
      accountRepository,
      ledgerRepository,
      transactionRepository,
      balanceService,
    ),
    paymentService: new PaymentService(
      paymentOrderRepository,
      vendorRepository,
      vendorBankAccountRepository,
      accountRepository,
      transactionRepository,
      transactionService,
    ),
    expenseClaimService: new ExpenseClaimService(
      expenseClaimRepository,
      employeeRepository,
      departmentRepository,
      employmentRepository,
      paymentOrderRepository,
      accountRepository,
      transactionRepository,
      transactionService,
    ),
    transactionService,
  };
}

test('executing a draft expense claim creates an employee reimbursement payment and a posted finance transaction', async () => {
  const { accountService, expenseClaimService, paymentService, transactionService } =
    createServices();

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

  const claimsBefore = await expenseClaimService.list({ limit: 20 });
  const seededClaim = claimsBefore.data.find(
    (claim) => claim.expenseClaimNo === 'EXP-0001',
  );

  assert.ok(seededClaim);
  assert.equal(seededClaim?.status, 'DRAFT');

  const executed = await expenseClaimService.execute(seededClaim!.id);

  assert.equal(executed.status, 'EXECUTED');
  assert.equal(executed.paymentStatus, 'EXECUTED');
  assert.equal(executed.transactionStatus, 'POSTED');
  assert.ok(executed.paymentOrderId);
  assert.ok(executed.transactionCode);

  const vendorPayments = await paymentService.list({ limit: 20 });
  assert.equal(vendorPayments.data.length, 1);
  assert.ok(
    vendorPayments.data.every((payment) => payment.vendorId),
    'procurement payment list should remain vendor-only',
  );

  const afterAccounts = await accountService.list({
    ledgerId: 'ledger_cn_main',
    limit: 50,
  });
  const cashAfter = afterAccounts.data.find((account) => account.id === 'acct_cash_main');
  const expenseAfter = afterAccounts.data.find(
    (account) => account.id === 'acct_expense_office',
  );

  assert.equal(cashAfter?.balance, 49140);
  assert.equal(expenseAfter?.balance, 860);

  const transactions = await transactionService.list({ limit: 20 });
  const expenseTransaction = transactions.data.find(
    (transaction) => transaction.referenceNo === 'EXP-DEMO-001',
  );

  assert.ok(expenseTransaction);
  assert.equal(expenseTransaction?.status, 'POSTED');
  assert.equal(expenseTransaction?.type, 'PAYMENT');
});
