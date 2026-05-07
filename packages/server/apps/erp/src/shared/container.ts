import type {
  AccountRepository,
  BankRepository,
  LedgerRepository,
  TransactionRepository,
} from '../domain/fin/repositories.ts';
import type {
  GoodsReceiptRepository,
  PaymentOrderRepository,
  ProductRepository,
  PurchaseOrderRepository,
  VendorBankAccountRepository,
  VendorInvoiceRepository,
  VendorRepository,
} from '../domain/procurement/repositories.ts';
import type {
  CustomerBankAccountRepository,
  CustomerRepository,
  ReceiptOrderRepository,
} from '../domain/crm/repositories.ts';
import type {
  DepartmentRepository,
  EmployeeRepository,
  EmploymentRepository,
  ExpenseClaimRepository,
  PositionRepository,
} from '../domain/hr/repositories.ts';
import { AccountService } from '../application/fin/account-service.ts';
import { BankService } from '../application/fin/bank-service.ts';
import { AccountBalanceService } from '../application/fin/balance-service.ts';
import { LedgerService } from '../application/fin/ledger-service.ts';
import { TransactionService } from '../application/fin/transaction-service.ts';
import { CustomerBankAccountService } from '../application/crm/customer-bank-account-service.ts';
import { CustomerService } from '../application/crm/customer-service.ts';
import { ReceiptService } from '../application/crm/receipt-service.ts';
import { DepartmentService } from '../application/hr/department-service.ts';
import { EmployeeService } from '../application/hr/employee-service.ts';
import { EmploymentService } from '../application/hr/employment-service.ts';
import { ExpenseClaimService } from '../application/hr/expense-claim-service.ts';
import { PositionService } from '../application/hr/position-service.ts';
import { PaymentService } from '../application/procurement/payment-service.ts';
import { ProductService } from '../application/procurement/product-service.ts';
import { PurchaseOrderService } from '../application/procurement/purchase-order-service.ts';
import { GoodsReceiptService } from '../application/procurement/goods-receipt-service.ts';
import { VendorBankAccountService } from '../application/procurement/vendor-bank-account-service.ts';
import { VendorService } from '../application/procurement/vendor-service.ts';
import { VendorInvoiceService } from '../application/procurement/vendor-invoice-service.ts';
import { readConfig, type AppConfig } from './config.ts';
import { createMemorySeedData } from '../infrastructure/persistence/memory/seed.ts';
import { MemoryBankRepository } from '../infrastructure/persistence/memory/memory-bank-repository.ts';
import { MemoryLedgerRepository } from '../infrastructure/persistence/memory/memory-ledger-repository.ts';
import { MemoryAccountRepository } from '../infrastructure/persistence/memory/memory-account-repository.ts';
import { MemoryTransactionRepository } from '../infrastructure/persistence/memory/memory-transaction-repository.ts';
import { MemoryPaymentOrderRepository } from '../infrastructure/persistence/memory/memory-payment-order-repository.ts';
import { MemoryProductRepository } from '../infrastructure/persistence/memory/memory-product-repository.ts';
import { MemoryPurchaseOrderRepository } from '../infrastructure/persistence/memory/memory-purchase-order-repository.ts';
import { MemoryGoodsReceiptRepository } from '../infrastructure/persistence/memory/memory-goods-receipt-repository.ts';
import { MemoryVendorBankAccountRepository } from '../infrastructure/persistence/memory/memory-vendor-bank-account-repository.ts';
import { MemoryVendorRepository } from '../infrastructure/persistence/memory/memory-vendor-repository.ts';
import { MemoryVendorInvoiceRepository } from '../infrastructure/persistence/memory/memory-vendor-invoice-repository.ts';
import { MemoryCustomerBankAccountRepository } from '../infrastructure/persistence/memory/memory-customer-bank-account-repository.ts';
import { MemoryCustomerRepository } from '../infrastructure/persistence/memory/memory-customer-repository.ts';
import { MemoryReceiptOrderRepository } from '../infrastructure/persistence/memory/memory-receipt-order-repository.ts';
import { MemoryDepartmentRepository } from '../infrastructure/persistence/memory/memory-department-repository.ts';
import { MemoryPositionRepository } from '../infrastructure/persistence/memory/memory-position-repository.ts';
import { MemoryEmployeeRepository } from '../infrastructure/persistence/memory/memory-employee-repository.ts';
import { MemoryEmploymentRepository } from '../infrastructure/persistence/memory/memory-employment-repository.ts';
import { MemoryExpenseClaimRepository } from '../infrastructure/persistence/memory/memory-expense-claim-repository.ts';
import { createAppDataSource, ensureDatabaseReady } from '../../data-source.ts';
import { TypeOrmBankRepository } from '../infrastructure/persistence/typeorm/typeorm-bank-repository.ts';
import { TypeOrmLedgerRepository } from '../infrastructure/persistence/typeorm/typeorm-ledger-repository.ts';
import { TypeOrmAccountRepository } from '../infrastructure/persistence/typeorm/typeorm-account-repository.ts';
import { TypeOrmTransactionRepository } from '../infrastructure/persistence/typeorm/typeorm-transaction-repository.ts';
import { TypeOrmPaymentOrderRepository } from '../infrastructure/persistence/typeorm/typeorm-payment-order-repository.ts';
import { TypeOrmProductRepository } from '../infrastructure/persistence/typeorm/typeorm-product-repository.ts';
import { TypeOrmPurchaseOrderRepository } from '../infrastructure/persistence/typeorm/typeorm-purchase-order-repository.ts';
import { TypeOrmGoodsReceiptRepository } from '../infrastructure/persistence/typeorm/typeorm-goods-receipt-repository.ts';
import { TypeOrmVendorBankAccountRepository } from '../infrastructure/persistence/typeorm/typeorm-vendor-bank-account-repository.ts';
import { TypeOrmVendorRepository } from '../infrastructure/persistence/typeorm/typeorm-vendor-repository.ts';
import { TypeOrmVendorInvoiceRepository } from '../infrastructure/persistence/typeorm/typeorm-vendor-invoice-repository.ts';
import { TypeOrmCustomerBankAccountRepository } from '../infrastructure/persistence/typeorm/typeorm-customer-bank-account-repository.ts';
import { TypeOrmCustomerRepository } from '../infrastructure/persistence/typeorm/typeorm-customer-repository.ts';
import { TypeOrmReceiptOrderRepository } from '../infrastructure/persistence/typeorm/typeorm-receipt-order-repository.ts';
import { TypeOrmDepartmentRepository } from '../infrastructure/persistence/typeorm/typeorm-department-repository.ts';
import { TypeOrmPositionRepository } from '../infrastructure/persistence/typeorm/typeorm-position-repository.ts';
import { TypeOrmEmployeeRepository } from '../infrastructure/persistence/typeorm/typeorm-employee-repository.ts';
import { TypeOrmEmploymentRepository } from '../infrastructure/persistence/typeorm/typeorm-employment-repository.ts';
import { TypeOrmExpenseClaimRepository } from '../infrastructure/persistence/typeorm/typeorm-expense-claim-repository.ts';
import { seedDbIfEmpty } from '../infrastructure/persistence/typeorm/seed-db.ts';

export interface AppContainer {
  config: AppConfig;
  bankService: BankService;
  ledgerService: LedgerService;
  accountService: AccountService;
  transactionService: TransactionService;
  productService: ProductService;
  vendorService: VendorService;
  vendorBankAccountService: VendorBankAccountService;
  purchaseOrderService: PurchaseOrderService;
  goodsReceiptService: GoodsReceiptService;
  vendorInvoiceService: VendorInvoiceService;
  paymentService: PaymentService;
  customerService: CustomerService;
  customerBankAccountService: CustomerBankAccountService;
  receiptService: ReceiptService;
  departmentService: DepartmentService;
  positionService: PositionService;
  employeeService: EmployeeService;
  employmentService: EmploymentService;
  expenseClaimService: ExpenseClaimService;
  close(): Promise<void>;
}

export async function createAppContainer(): Promise<AppContainer> {
  const config = readConfig();

  let bankRepository: BankRepository;
  let ledgerRepository: LedgerRepository;
  let accountRepository: AccountRepository;
  let transactionRepository: TransactionRepository;
  let productRepository: ProductRepository;
  let vendorRepository: VendorRepository;
  let vendorBankAccountRepository: VendorBankAccountRepository;
  let purchaseOrderRepository: PurchaseOrderRepository;
  let goodsReceiptRepository: GoodsReceiptRepository;
  let vendorInvoiceRepository: VendorInvoiceRepository;
  let paymentOrderRepository: PaymentOrderRepository;
  let customerRepository: CustomerRepository;
  let customerBankAccountRepository: CustomerBankAccountRepository;
  let receiptOrderRepository: ReceiptOrderRepository;
  let departmentRepository: DepartmentRepository;
  let positionRepository: PositionRepository;
  let employeeRepository: EmployeeRepository;
  let employmentRepository: EmploymentRepository;
  let expenseClaimRepository: ExpenseClaimRepository;
  let close = async () => {};

  if (config.dataMode === 'db') {
    await ensureDatabaseReady(config);
    const dataSource = createAppDataSource(config);
    await dataSource.initialize();

    bankRepository = new TypeOrmBankRepository(dataSource);
    ledgerRepository = new TypeOrmLedgerRepository(dataSource);
    accountRepository = new TypeOrmAccountRepository(dataSource);
    transactionRepository = new TypeOrmTransactionRepository(dataSource);
    productRepository = new TypeOrmProductRepository(dataSource);
    vendorRepository = new TypeOrmVendorRepository(dataSource);
    vendorBankAccountRepository = new TypeOrmVendorBankAccountRepository(dataSource);
    purchaseOrderRepository = new TypeOrmPurchaseOrderRepository(dataSource);
    goodsReceiptRepository = new TypeOrmGoodsReceiptRepository(dataSource);
    vendorInvoiceRepository = new TypeOrmVendorInvoiceRepository(dataSource);
    paymentOrderRepository = new TypeOrmPaymentOrderRepository(dataSource);
    customerRepository = new TypeOrmCustomerRepository(dataSource);
    customerBankAccountRepository = new TypeOrmCustomerBankAccountRepository(dataSource);
    receiptOrderRepository = new TypeOrmReceiptOrderRepository(dataSource);
    departmentRepository = new TypeOrmDepartmentRepository(dataSource);
    positionRepository = new TypeOrmPositionRepository(dataSource);
    employeeRepository = new TypeOrmEmployeeRepository(dataSource);
    employmentRepository = new TypeOrmEmploymentRepository(dataSource);
    expenseClaimRepository = new TypeOrmExpenseClaimRepository(dataSource);
    await seedDbIfEmpty({
      bankRepository,
      ledgerRepository,
      accountRepository,
      transactionRepository,
      productRepository,
      vendorRepository,
      vendorBankAccountRepository,
      purchaseOrderRepository,
      goodsReceiptRepository,
      vendorInvoiceRepository,
      paymentOrderRepository,
      customerRepository,
      customerBankAccountRepository,
      receiptOrderRepository,
      departmentRepository,
      positionRepository,
      employeeRepository,
      employmentRepository,
      expenseClaimRepository,
    });
    close = async () => {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    };
  } else {
    const seed = createMemorySeedData();
    bankRepository = new MemoryBankRepository(seed.banks);
    ledgerRepository = new MemoryLedgerRepository(seed.ledgers);
    accountRepository = new MemoryAccountRepository(seed.accounts);
    transactionRepository = new MemoryTransactionRepository(seed.transactions);
    productRepository = new MemoryProductRepository(seed.products);
    vendorRepository = new MemoryVendorRepository(seed.vendors);
    vendorBankAccountRepository = new MemoryVendorBankAccountRepository(
      seed.vendorBankAccounts,
    );
    purchaseOrderRepository = new MemoryPurchaseOrderRepository(seed.purchaseOrders);
    goodsReceiptRepository = new MemoryGoodsReceiptRepository(seed.goodsReceipts);
    vendorInvoiceRepository = new MemoryVendorInvoiceRepository(seed.vendorInvoices);
    paymentOrderRepository = new MemoryPaymentOrderRepository(seed.payments);
    customerRepository = new MemoryCustomerRepository(seed.customers);
    customerBankAccountRepository = new MemoryCustomerBankAccountRepository(
      seed.customerBankAccounts,
    );
    receiptOrderRepository = new MemoryReceiptOrderRepository(seed.receipts);
    departmentRepository = new MemoryDepartmentRepository(seed.departments);
    positionRepository = new MemoryPositionRepository(seed.positions);
    employeeRepository = new MemoryEmployeeRepository(seed.employees);
    employmentRepository = new MemoryEmploymentRepository(seed.employments);
    expenseClaimRepository = new MemoryExpenseClaimRepository(seed.expenseClaims);
  }

  const balanceService = new AccountBalanceService(transactionRepository);
  const bankService = new BankService(bankRepository, ledgerRepository);
  const ledgerService = new LedgerService(
    ledgerRepository,
    bankRepository,
    accountRepository,
    transactionRepository,
  );
  const accountService = new AccountService(
    accountRepository,
    ledgerRepository,
    transactionRepository,
    balanceService,
  );
  const transactionService = new TransactionService(
    transactionRepository,
    ledgerRepository,
    accountRepository,
  );
  const productService = new ProductService(
    productRepository,
    purchaseOrderRepository,
    goodsReceiptRepository,
  );
  const vendorService = new VendorService(
    vendorRepository,
    vendorBankAccountRepository,
    paymentOrderRepository,
  );
  const vendorBankAccountService = new VendorBankAccountService(
    vendorBankAccountRepository,
    vendorRepository,
    paymentOrderRepository,
  );
  const purchaseOrderService = new PurchaseOrderService(
    purchaseOrderRepository,
    vendorRepository,
    productRepository,
    goodsReceiptRepository,
    vendorInvoiceRepository,
  );
  const goodsReceiptService = new GoodsReceiptService(
    goodsReceiptRepository,
    purchaseOrderRepository,
    vendorRepository,
    productRepository,
    vendorInvoiceRepository,
  );
  const vendorInvoiceService = new VendorInvoiceService(
    vendorInvoiceRepository,
    vendorRepository,
    purchaseOrderRepository,
    goodsReceiptRepository,
    vendorBankAccountRepository,
    paymentOrderRepository,
    accountRepository,
    transactionRepository,
    transactionService,
  );
  const paymentService = new PaymentService(
    paymentOrderRepository,
    vendorRepository,
    vendorBankAccountRepository,
    accountRepository,
    transactionRepository,
    transactionService,
  );
  const customerService = new CustomerService(
    customerRepository,
    customerBankAccountRepository,
    receiptOrderRepository,
  );
  const customerBankAccountService = new CustomerBankAccountService(
    customerBankAccountRepository,
    customerRepository,
    receiptOrderRepository,
  );
  const receiptService = new ReceiptService(
    receiptOrderRepository,
    customerRepository,
    customerBankAccountRepository,
    accountRepository,
    transactionRepository,
    transactionService,
  );
  const departmentService = new DepartmentService(
    departmentRepository,
    employmentRepository,
    expenseClaimRepository,
  );
  const positionService = new PositionService(
    positionRepository,
    employmentRepository,
  );
  const employeeService = new EmployeeService(
    employeeRepository,
    employmentRepository,
    expenseClaimRepository,
    departmentRepository,
    positionRepository,
  );
  const employmentService = new EmploymentService(
    employmentRepository,
    employeeRepository,
    departmentRepository,
    positionRepository,
  );
  const expenseClaimService = new ExpenseClaimService(
    expenseClaimRepository,
    employeeRepository,
    departmentRepository,
    employmentRepository,
    paymentOrderRepository,
    accountRepository,
    transactionRepository,
    transactionService,
  );

  return {
    config,
    bankService,
    ledgerService,
    accountService,
    transactionService,
    productService,
    vendorService,
    vendorBankAccountService,
    purchaseOrderService,
    goodsReceiptService,
    vendorInvoiceService,
    paymentService,
    customerService,
    customerBankAccountService,
    receiptService,
    departmentService,
    positionService,
    employeeService,
    employmentService,
    expenseClaimService,
    close,
  };
}
