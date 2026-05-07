import type {
  AccountRepository,
  BankRepository,
  LedgerRepository,
  TransactionRepository,
} from '../../../domain/fin/repositories.ts';
import type {
  CustomerBankAccountRepository,
  CustomerRepository,
  ReceiptOrderRepository,
} from '../../../domain/crm/repositories.ts';
import type {
  DepartmentRepository,
  EmployeeRepository,
  EmploymentRepository,
  ExpenseClaimRepository,
  PositionRepository,
} from '../../../domain/hr/repositories.ts';
import type {
  GoodsReceiptRepository,
  PaymentOrderRepository,
  ProductRepository,
  PurchaseOrderRepository,
  VendorBankAccountRepository,
  VendorInvoiceRepository,
  VendorRepository,
} from '../../../domain/procurement/repositories.ts';
import { createMemorySeedData } from '../memory/seed.ts';

async function ensureSeedRecords<T>(
  existingItems: T[],
  seededItems: T[],
  readId: (item: T) => string,
  save: (item: T) => Promise<unknown>,
): Promise<boolean> {
  const existingIds = new Set(existingItems.map(readId));
  let inserted = false;

  for (const item of seededItems) {
    if (existingIds.has(readId(item))) {
      continue;
    }

    await save(item);
    inserted = true;
  }

  return inserted;
}

export async function seedDbIfEmpty(repositories: {
  bankRepository: BankRepository;
  ledgerRepository: LedgerRepository;
  accountRepository: AccountRepository;
  transactionRepository: TransactionRepository;
  vendorRepository: VendorRepository;
  vendorBankAccountRepository: VendorBankAccountRepository;
  productRepository: ProductRepository;
  purchaseOrderRepository: PurchaseOrderRepository;
  goodsReceiptRepository: GoodsReceiptRepository;
  vendorInvoiceRepository: VendorInvoiceRepository;
  paymentOrderRepository: PaymentOrderRepository;
  customerRepository: CustomerRepository;
  customerBankAccountRepository: CustomerBankAccountRepository;
  receiptOrderRepository: ReceiptOrderRepository;
  departmentRepository: DepartmentRepository;
  positionRepository: PositionRepository;
  employeeRepository: EmployeeRepository;
  employmentRepository: EmploymentRepository;
  expenseClaimRepository: ExpenseClaimRepository;
}): Promise<boolean> {
  const [
    banks,
    ledgers,
    accounts,
    transactions,
    vendors,
    vendorBankAccounts,
    products,
    purchaseOrders,
    goodsReceipts,
    vendorInvoices,
    payments,
    customers,
    customerBankAccounts,
    receipts,
    departments,
    positions,
    employees,
    employments,
    expenseClaims,
  ] = await Promise.all([
    repositories.bankRepository.listAll(),
    repositories.ledgerRepository.listAll(),
    repositories.accountRepository.listAll(),
    repositories.transactionRepository.listAll(),
    repositories.vendorRepository.listAll(),
    repositories.vendorBankAccountRepository.listAll(),
    repositories.productRepository.listAll(),
    repositories.purchaseOrderRepository.listAll(),
    repositories.goodsReceiptRepository.listAll(),
    repositories.vendorInvoiceRepository.listAll(),
    repositories.paymentOrderRepository.listAll(),
    repositories.customerRepository.listAll(),
    repositories.customerBankAccountRepository.listAll(),
    repositories.receiptOrderRepository.listAll(),
    repositories.departmentRepository.listAll(),
    repositories.positionRepository.listAll(),
    repositories.employeeRepository.listAll(),
    repositories.employmentRepository.listAll(),
    repositories.expenseClaimRepository.listAll(),
  ]);

  const seed = createMemorySeedData();
  let seeded = false;

  seeded =
    (await ensureSeedRecords(
      banks,
      seed.banks,
      (item) => item.id,
      (item) => repositories.bankRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      ledgers,
      seed.ledgers,
      (item) => item.id,
      (item) => repositories.ledgerRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      accounts,
      seed.accounts,
      (item) => item.id,
      (item) => repositories.accountRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      transactions,
      seed.transactions,
      (item) => item.header.id,
      (item) => repositories.transactionRepository.save(item),
    )) || seeded;

  seeded =
    (await ensureSeedRecords(
      vendors,
      seed.vendors,
      (item) => item.id,
      (item) => repositories.vendorRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      vendorBankAccounts,
      seed.vendorBankAccounts,
      (item) => item.id,
      (item) => repositories.vendorBankAccountRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      products,
      seed.products,
      (item) => item.id,
      (item) => repositories.productRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      purchaseOrders,
      seed.purchaseOrders,
      (item) => item.id,
      (item) => repositories.purchaseOrderRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      goodsReceipts,
      seed.goodsReceipts,
      (item) => item.id,
      (item) => repositories.goodsReceiptRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      vendorInvoices,
      seed.vendorInvoices,
      (item) => item.id,
      (item) => repositories.vendorInvoiceRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      payments,
      seed.payments,
      (item) => item.id,
      (item) => repositories.paymentOrderRepository.save(item),
    )) || seeded;

  seeded =
    (await ensureSeedRecords(
      customers,
      seed.customers,
      (item) => item.id,
      (item) => repositories.customerRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      customerBankAccounts,
      seed.customerBankAccounts,
      (item) => item.id,
      (item) => repositories.customerBankAccountRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      receipts,
      seed.receipts,
      (item) => item.id,
      (item) => repositories.receiptOrderRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      departments,
      seed.departments,
      (item) => item.id,
      (item) => repositories.departmentRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      positions,
      seed.positions,
      (item) => item.id,
      (item) => repositories.positionRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      employees,
      seed.employees,
      (item) => item.id,
      (item) => repositories.employeeRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      employments,
      seed.employments,
      (item) => item.id,
      (item) => repositories.employmentRepository.save(item),
    )) || seeded;
  seeded =
    (await ensureSeedRecords(
      expenseClaims,
      seed.expenseClaims,
      (item) => item.id,
      (item) => repositories.expenseClaimRepository.save(item),
    )) || seeded;

  return seeded;
}
