import test from 'node:test';
import assert from 'node:assert/strict';

import { AccountService } from '../application/fin/account-service.ts';
import { AccountBalanceService } from '../application/fin/balance-service.ts';
import { LedgerService } from '../application/fin/ledger-service.ts';
import { TransactionService } from '../application/fin/transaction-service.ts';
import { GoodsReceiptService } from '../application/procurement/goods-receipt-service.ts';
import { PaymentService } from '../application/procurement/payment-service.ts';
import { ProductService } from '../application/procurement/product-service.ts';
import { PurchaseOrderService } from '../application/procurement/purchase-order-service.ts';
import { VendorBankAccountService } from '../application/procurement/vendor-bank-account-service.ts';
import { VendorInvoiceService } from '../application/procurement/vendor-invoice-service.ts';
import { VendorService } from '../application/procurement/vendor-service.ts';
import { MemoryAccountRepository } from '../infrastructure/persistence/memory/memory-account-repository.ts';
import { MemoryBankRepository } from '../infrastructure/persistence/memory/memory-bank-repository.ts';
import { MemoryGoodsReceiptRepository } from '../infrastructure/persistence/memory/memory-goods-receipt-repository.ts';
import { MemoryLedgerRepository } from '../infrastructure/persistence/memory/memory-ledger-repository.ts';
import { MemoryPaymentOrderRepository } from '../infrastructure/persistence/memory/memory-payment-order-repository.ts';
import { MemoryProductRepository } from '../infrastructure/persistence/memory/memory-product-repository.ts';
import { MemoryPurchaseOrderRepository } from '../infrastructure/persistence/memory/memory-purchase-order-repository.ts';
import { createMemorySeedData } from '../infrastructure/persistence/memory/seed.ts';
import { MemoryTransactionRepository } from '../infrastructure/persistence/memory/memory-transaction-repository.ts';
import { MemoryVendorBankAccountRepository } from '../infrastructure/persistence/memory/memory-vendor-bank-account-repository.ts';
import { MemoryVendorInvoiceRepository } from '../infrastructure/persistence/memory/memory-vendor-invoice-repository.ts';
import { MemoryVendorRepository } from '../infrastructure/persistence/memory/memory-vendor-repository.ts';
import { AppError } from '../shared/errors.ts';

function createServices() {
  const seed = createMemorySeedData();
  const bankRepository = new MemoryBankRepository(seed.banks);
  const ledgerRepository = new MemoryLedgerRepository(seed.ledgers);
  const accountRepository = new MemoryAccountRepository(seed.accounts);
  const transactionRepository = new MemoryTransactionRepository(seed.transactions);
  const productRepository = new MemoryProductRepository(seed.products);
  const vendorRepository = new MemoryVendorRepository(seed.vendors);
  const vendorBankAccountRepository = new MemoryVendorBankAccountRepository(
    seed.vendorBankAccounts,
  );
  const purchaseOrderRepository = new MemoryPurchaseOrderRepository(seed.purchaseOrders);
  const goodsReceiptRepository = new MemoryGoodsReceiptRepository(seed.goodsReceipts);
  const vendorInvoiceRepository = new MemoryVendorInvoiceRepository(seed.vendorInvoices);
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
    productService: new ProductService(
      productRepository,
      purchaseOrderRepository,
      goodsReceiptRepository,
    ),
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
    purchaseOrderService: new PurchaseOrderService(
      purchaseOrderRepository,
      vendorRepository,
      productRepository,
      goodsReceiptRepository,
      vendorInvoiceRepository,
    ),
    goodsReceiptService: new GoodsReceiptService(
      goodsReceiptRepository,
      purchaseOrderRepository,
      vendorRepository,
      productRepository,
      vendorInvoiceRepository,
    ),
    vendorInvoiceService: new VendorInvoiceService(
      vendorInvoiceRepository,
      vendorRepository,
      purchaseOrderRepository,
      goodsReceiptRepository,
      vendorBankAccountRepository,
      paymentOrderRepository,
      accountRepository,
      transactionRepository,
      transactionService,
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

test('executing a draft vendor invoice creates a vendor payment order and a posted finance transaction', async () => {
  const { accountService, vendorInvoiceService, paymentService, transactionService } =
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

  const invoicesBefore = await vendorInvoiceService.list({ limit: 20 });
  const seededInvoice = invoicesBefore.data.find(
    (invoice) => invoice.vendorInvoiceNo === 'INV-0001',
  );

  assert.ok(seededInvoice);
  assert.equal(seededInvoice?.status, 'DRAFT');

  const executed = await vendorInvoiceService.execute(seededInvoice!.id);

  assert.equal(executed.status, 'EXECUTED');
  assert.equal(executed.paymentStatus, 'EXECUTED');
  assert.equal(executed.transactionStatus, 'POSTED');
  assert.equal(executed.paymentOrderNo, 'PMT-0002');
  assert.equal(executed.transactionCode, 'TRX-0003');

  const payments = await paymentService.list({ limit: 20 });
  const linkedPayment = payments.data.find(
    (payment) => payment.paymentOrderNo === executed.paymentOrderNo,
  );

  assert.ok(linkedPayment);
  assert.equal(linkedPayment?.status, 'EXECUTED');
  assert.equal(linkedPayment?.transactionStatus, 'POSTED');
  assert.equal(linkedPayment?.referenceNo, 'INV-DEMO-001');

  const transactions = await transactionService.list({ limit: 20 });
  const invoiceTransaction = transactions.data.find(
    (transaction) => transaction.referenceNo === 'INV-DEMO-001',
  );

  assert.ok(invoiceTransaction);
  assert.equal(invoiceTransaction?.status, 'POSTED');
  assert.equal(invoiceTransaction?.type, 'PAYMENT');

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
});


test('creating a vendor invoice rejects a non-expense expense account', async () => {
  const { vendorInvoiceService } = createServices();

  await assert.rejects(
    () =>
      vendorInvoiceService.create({
        vendorId: 'vendor_delta_supply',
        purchaseOrderId: 'purchase_order_seed_ordered',
        goodsReceiptId: 'goods_receipt_seed_received',
        payFromAccountId: 'acct_cash_main',
        expenseAccountId: 'acct_equity_capital',
        amount: 1200,
        currency: 'CNY',
        invoiceDate: '2026-04-16',
        status: 'DRAFT',
        referenceNo: 'INV-TYPE-001',
        description: 'Should fail for non-expense accounts',
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, 'VENDOR_INVOICE_EXPENSE_ACCOUNT_INVALID');
      return true;
    },
  );
});


test('creating a vendor invoice rejects a non-asset pay-from account', async () => {
  const { vendorInvoiceService } = createServices();

  await assert.rejects(
    () =>
      vendorInvoiceService.create({
        vendorId: 'vendor_delta_supply',
        purchaseOrderId: 'purchase_order_seed_ordered',
        goodsReceiptId: 'goods_receipt_seed_received',
        payFromAccountId: 'acct_equity_capital',
        expenseAccountId: 'acct_expense_office',
        amount: 1200,
        currency: 'CNY',
        invoiceDate: '2026-04-16',
        status: 'DRAFT',
        referenceNo: 'INV-TYPE-002',
        description: 'Should fail for non-asset pay-from accounts',
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, 'VENDOR_INVOICE_PAY_FROM_ACCOUNT_INVALID');
      return true;
    },
  );
});
