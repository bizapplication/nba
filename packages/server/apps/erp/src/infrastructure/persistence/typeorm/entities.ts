import { EntitySchema } from 'typeorm';

import type {
  FinancialAccount,
  FinancialInstitution,
  LedgerBook,
  TransactionHeader,
  TransactionLine,
} from '../../../domain/fin/types.ts';
import type {
  Customer,
  CustomerBankAccount,
  ReceiptOrder,
} from '../../../domain/crm/types.ts';
import type {
  Department,
  Employee,
  Employment,
  ExpenseClaim,
  Position,
} from '../../../domain/hr/types.ts';
import type {
  GoodsReceipt,
  PaymentOrder,
  Product,
  PurchaseOrder,
  Vendor,
  VendorBankAccount,
  VendorInvoice,
} from '../../../domain/procurement/types.ts';

function toIsoTimestamp(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }

  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function toDateOnly(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

const timestampTransformer = {
  to(value: string | null | undefined): string | null {
    return value ?? null;
  },
  from(value: Date | string | null): string | null {
    return toIsoTimestamp(value);
  },
};

const dateTransformer = {
  to(value: string): string {
    return value;
  },
  from(value: Date | string): string {
    return toDateOnly(value);
  },
};

const numericTransformer = {
  to(value: number): number {
    return value;
  },
  from(value: string | number | null): number {
    return value === null ? 0 : Number(value);
  },
};

export const financialInstitutionEntity = new EntitySchema<FinancialInstitution>({
  name: 'FinancialInstitution',
  tableName: 'financial_institution',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    institutionCode: { name: 'institution_code', type: 'varchar', length: 64 },
    name: { type: 'varchar', length: 255 },
    shortName: { name: 'short_name', type: 'varchar', length: 255 },
    displayName: { name: 'display_name', type: 'varchar', length: 255 },
    institutionType: { name: 'institution_type', type: 'varchar', length: 32 },
    externalBankCode: { name: 'external_bank_code', type: 'varchar', length: 64 },
    description: { type: 'text', nullable: true },
    financialStatus: { name: 'financial_status', type: 'varchar', length: 32 },
    status: { type: 'varchar', length: 32 },
    countryCode: { name: 'country_code', type: 'varchar', length: 8, nullable: true },
    currencyCodeDefault: {
      name: 'currency_code_default',
      type: 'varchar',
      length: 8,
      nullable: true,
    },
    partyId: { name: 'party_id', type: 'varchar', length: 64, nullable: true },
    metadata: { type: 'jsonb', nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_financial_institution_institution_code',
      columns: ['institutionCode'],
    },
    {
      name: 'uq_financial_institution_external_bank_code',
      columns: ['externalBankCode'],
    },
  ],
});

export const ledgerBookEntity = new EntitySchema<LedgerBook>({
  name: 'LedgerBook',
  tableName: 'ledger_book',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    code: { type: 'varchar', length: 64 },
    name: { type: 'varchar', length: 255 },
    description: { type: 'text', nullable: true },
    bookType: { name: 'book_type', type: 'varchar', length: 32 },
    parentBookId: {
      name: 'parent_book_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    linkedInstitutionId: {
      name: 'linked_institution_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    baseCurrencyCode: {
      name: 'base_currency_code',
      type: 'varchar',
      length: 8,
    },
    status: { type: 'varchar', length: 32 },
    legalEntityId: {
      name: 'legal_entity_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    effectiveFrom: {
      name: 'effective_from',
      type: 'date',
      nullable: true,
      transformer: dateTransformer,
    },
    effectiveTo: {
      name: 'effective_to',
      type: 'date',
      nullable: true,
      transformer: dateTransformer,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_ledger_book_code',
      columns: ['code'],
    },
  ],
});

export const financialAccountEntity = new EntitySchema<FinancialAccount>({
  name: 'FinancialAccount',
  tableName: 'financial_account',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    accountCode: { name: 'account_code', type: 'varchar', length: 64 },
    accountName: { name: 'account_name', type: 'varchar', length: 255 },
    accountCategory: { name: 'account_category', type: 'varchar', length: 32 },
    normalBalance: { name: 'normal_balance', type: 'varchar', length: 16 },
    currencyCode: { name: 'currency_code', type: 'varchar', length: 8 },
    ledgerBookId: { name: 'ledger_book_id', type: 'varchar', length: 64 },
    parentAccountId: {
      name: 'parent_account_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    postingLevel: { name: 'posting_level', type: 'varchar', length: 16 },
    accountStatus: { name: 'account_status', type: 'varchar', length: 32 },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    description: { type: 'text', nullable: true },
  },
  uniques: [
    {
      name: 'uq_financial_account_account_code',
      columns: ['accountCode'],
    },
  ],
});

export const transactionHeaderEntity = new EntitySchema<TransactionHeader>({
  name: 'TransactionHeader',
  tableName: 'transaction_header',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    code: { type: 'varchar', length: 64 },
    businessType: { name: 'business_type', type: 'varchar', length: 32 },
    sourceType: {
      name: 'source_type',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    sourceId: {
      name: 'source_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    ledgerBookId: { name: 'ledger_book_id', type: 'varchar', length: 64 },
    transactionDate: {
      name: 'transaction_date',
      type: 'date',
      transformer: dateTransformer,
    },
    description: { type: 'text', nullable: true },
    referenceNo: {
      name: 'reference_no',
      type: 'varchar',
      length: 128,
      nullable: true,
    },
    status: { type: 'varchar', length: 32 },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    postedAt: {
      name: 'posted_at',
      type: 'timestamptz',
      nullable: true,
      transformer: timestampTransformer,
    },
    unpostedAt: {
      name: 'unposted_at',
      type: 'timestamptz',
      nullable: true,
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_transaction_header_code',
      columns: ['code'],
    },
  ],
});

export const transactionLineEntity = new EntitySchema<TransactionLine>({
  name: 'TransactionLine',
  tableName: 'transaction_line',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    transactionId: { name: 'transaction_id', type: 'varchar', length: 64 },
    entryType: { name: 'entry_type', type: 'varchar', length: 16 },
    accountId: { name: 'account_id', type: 'varchar', length: 64 },
    amount: {
      type: 'numeric',
      precision: 18,
      scale: 2,
      transformer: numericTransformer,
    },
    currencyCode: { name: 'currency_code', type: 'varchar', length: 8 },
    lineNo: { name: 'line_no', type: 'int' },
  },
  uniques: [
    {
      name: 'uq_transaction_line_txn_line_no',
      columns: ['transactionId', 'lineNo'],
    },
  ],
});

export const productEntity = new EntitySchema<Product>({
  name: 'Product',
  tableName: 'product',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    productCode: { name: 'product_code', type: 'varchar', length: 64 },
    productName: { name: 'product_name', type: 'varchar', length: 255 },
    unit: { type: 'varchar', length: 32 },
    status: { type: 'varchar', length: 32 },
    description: { type: 'text', nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_product_product_code',
      columns: ['productCode'],
    },
  ],
});

export const vendorEntity = new EntitySchema<Vendor>({
  name: 'Vendor',
  tableName: 'vendor',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    vendorCode: { name: 'vendor_code', type: 'varchar', length: 64 },
    vendorName: { name: 'vendor_name', type: 'varchar', length: 255 },
    shortName: { name: 'short_name', type: 'varchar', length: 255 },
    status: { type: 'varchar', length: 32 },
    defaultCurrency: { name: 'default_currency', type: 'varchar', length: 8 },
    description: { type: 'text', nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_vendor_vendor_code',
      columns: ['vendorCode'],
    },
  ],
});

export const vendorBankAccountEntity = new EntitySchema<VendorBankAccount>({
  name: 'VendorBankAccount',
  tableName: 'vendor_bank_account',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    vendorId: { name: 'vendor_id', type: 'varchar', length: 64 },
    bankName: { name: 'bank_name', type: 'varchar', length: 255 },
    accountName: { name: 'account_name', type: 'varchar', length: 255 },
    accountNo: { name: 'account_no', type: 'varchar', length: 128 },
    currencyCode: { name: 'currency_code', type: 'varchar', length: 8 },
    isDefault: { name: 'is_default', type: 'boolean' },
    status: { type: 'varchar', length: 32 },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
});

export const purchaseOrderEntity = new EntitySchema<PurchaseOrder>({
  name: 'PurchaseOrder',
  tableName: 'purchase_order',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    purchaseOrderNo: { name: 'purchase_order_no', type: 'varchar', length: 64 },
    vendorId: { name: 'vendor_id', type: 'varchar', length: 64 },
    productId: { name: 'product_id', type: 'varchar', length: 64 },
    quantity: {
      type: 'numeric',
      precision: 18,
      scale: 2,
      transformer: numericTransformer,
    },
    unitPrice: {
      name: 'unit_price',
      type: 'numeric',
      precision: 18,
      scale: 2,
      transformer: numericTransformer,
    },
    amount: {
      type: 'numeric',
      precision: 18,
      scale: 2,
      transformer: numericTransformer,
    },
    currencyCode: { name: 'currency_code', type: 'varchar', length: 8 },
    orderDate: {
      name: 'order_date',
      type: 'date',
      transformer: dateTransformer,
    },
    status: { type: 'varchar', length: 32 },
    referenceNo: {
      name: 'reference_no',
      type: 'varchar',
      length: 128,
      nullable: true,
    },
    description: { type: 'text', nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_purchase_order_no',
      columns: ['purchaseOrderNo'],
    },
  ],
});

export const goodsReceiptEntity = new EntitySchema<GoodsReceipt>({
  name: 'GoodsReceipt',
  tableName: 'goods_receipt',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    goodsReceiptNo: { name: 'goods_receipt_no', type: 'varchar', length: 64 },
    purchaseOrderId: { name: 'purchase_order_id', type: 'varchar', length: 64 },
    vendorId: { name: 'vendor_id', type: 'varchar', length: 64 },
    productId: { name: 'product_id', type: 'varchar', length: 64 },
    quantity: {
      type: 'numeric',
      precision: 18,
      scale: 2,
      transformer: numericTransformer,
    },
    receiptDate: {
      name: 'receipt_date',
      type: 'date',
      transformer: dateTransformer,
    },
    status: { type: 'varchar', length: 32 },
    referenceNo: {
      name: 'reference_no',
      type: 'varchar',
      length: 128,
      nullable: true,
    },
    description: { type: 'text', nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_goods_receipt_no',
      columns: ['goodsReceiptNo'],
    },
  ],
});

export const vendorInvoiceEntity = new EntitySchema<VendorInvoice>({
  name: 'VendorInvoice',
  tableName: 'vendor_invoice',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    vendorInvoiceNo: { name: 'vendor_invoice_no', type: 'varchar', length: 64 },
    vendorId: { name: 'vendor_id', type: 'varchar', length: 64 },
    purchaseOrderId: { name: 'purchase_order_id', type: 'varchar', length: 64 },
    goodsReceiptId: {
      name: 'goods_receipt_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    payFromAccountId: {
      name: 'pay_from_account_id',
      type: 'varchar',
      length: 64,
    },
    expenseAccountId: {
      name: 'expense_account_id',
      type: 'varchar',
      length: 64,
    },
    ledgerBookId: { name: 'ledger_book_id', type: 'varchar', length: 64 },
    amount: {
      type: 'numeric',
      precision: 18,
      scale: 2,
      transformer: numericTransformer,
    },
    currencyCode: { name: 'currency_code', type: 'varchar', length: 8 },
    invoiceDate: {
      name: 'invoice_date',
      type: 'date',
      transformer: dateTransformer,
    },
    status: { type: 'varchar', length: 32 },
    referenceNo: {
      name: 'reference_no',
      type: 'varchar',
      length: 128,
      nullable: true,
    },
    description: { type: 'text', nullable: true },
    linkedPaymentOrderId: {
      name: 'linked_payment_order_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    executedAt: {
      name: 'executed_at',
      type: 'timestamptz',
      nullable: true,
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_vendor_invoice_no',
      columns: ['vendorInvoiceNo'],
    },
  ],
});

export const paymentOrderEntity = new EntitySchema<PaymentOrder>({
  name: 'PaymentOrder',
  tableName: 'payment_order',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    paymentOrderNo: { name: 'payment_order_no', type: 'varchar', length: 64 },
    payeeType: {
      name: 'payee_type',
      type: 'varchar',
      length: 32,
      nullable: true,
    },
    vendorId: {
      name: 'vendor_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    vendorBankAccountId: {
      name: 'vendor_bank_account_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    employeeId: {
      name: 'employee_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    payFromAccountId: {
      name: 'pay_from_account_id',
      type: 'varchar',
      length: 64,
    },
    expenseAccountId: {
      name: 'expense_account_id',
      type: 'varchar',
      length: 64,
    },
    ledgerBookId: { name: 'ledger_book_id', type: 'varchar', length: 64 },
    amount: {
      type: 'numeric',
      precision: 18,
      scale: 2,
      transformer: numericTransformer,
    },
    currencyCode: { name: 'currency_code', type: 'varchar', length: 8 },
    purpose: { type: 'varchar', length: 255 },
    paymentDate: {
      name: 'payment_date',
      type: 'date',
      transformer: dateTransformer,
    },
    status: { type: 'varchar', length: 32 },
    referenceNo: {
      name: 'reference_no',
      type: 'varchar',
      length: 128,
      nullable: true,
    },
    description: { type: 'text', nullable: true },
    sourceType: {
      name: 'source_type',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    sourceId: {
      name: 'source_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    linkedTransactionId: {
      name: 'linked_transaction_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    executedAt: {
      name: 'executed_at',
      type: 'timestamptz',
      nullable: true,
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_payment_order_no',
      columns: ['paymentOrderNo'],
    },
  ],
});

export const customerEntity = new EntitySchema<Customer>({
  name: 'Customer',
  tableName: 'customer',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    customerCode: { name: 'customer_code', type: 'varchar', length: 64 },
    customerName: { name: 'customer_name', type: 'varchar', length: 255 },
    shortName: { name: 'short_name', type: 'varchar', length: 255 },
    status: { type: 'varchar', length: 32 },
    defaultCurrency: { name: 'default_currency', type: 'varchar', length: 8 },
    description: { type: 'text', nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_customer_customer_code',
      columns: ['customerCode'],
    },
  ],
});

export const customerBankAccountEntity = new EntitySchema<CustomerBankAccount>({
  name: 'CustomerBankAccount',
  tableName: 'customer_bank_account',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    customerId: { name: 'customer_id', type: 'varchar', length: 64 },
    bankName: { name: 'bank_name', type: 'varchar', length: 255 },
    accountName: { name: 'account_name', type: 'varchar', length: 255 },
    accountNo: { name: 'account_no', type: 'varchar', length: 128 },
    currencyCode: { name: 'currency_code', type: 'varchar', length: 8 },
    isDefault: { name: 'is_default', type: 'boolean' },
    status: { type: 'varchar', length: 32 },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
});

export const receiptOrderEntity = new EntitySchema<ReceiptOrder>({
  name: 'ReceiptOrder',
  tableName: 'receipt_order',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    receiptOrderNo: { name: 'receipt_order_no', type: 'varchar', length: 64 },
    customerId: { name: 'customer_id', type: 'varchar', length: 64 },
    customerBankAccountId: {
      name: 'customer_bank_account_id',
      type: 'varchar',
      length: 64,
    },
    receiptToAccountId: {
      name: 'receipt_to_account_id',
      type: 'varchar',
      length: 64,
    },
    revenueAccountId: {
      name: 'revenue_account_id',
      type: 'varchar',
      length: 64,
    },
    ledgerBookId: { name: 'ledger_book_id', type: 'varchar', length: 64 },
    amount: {
      type: 'numeric',
      precision: 18,
      scale: 2,
      transformer: numericTransformer,
    },
    currencyCode: { name: 'currency_code', type: 'varchar', length: 8 },
    purpose: { type: 'varchar', length: 255 },
    receiptDate: {
      name: 'receipt_date',
      type: 'date',
      transformer: dateTransformer,
    },
    status: { type: 'varchar', length: 32 },
    referenceNo: {
      name: 'reference_no',
      type: 'varchar',
      length: 128,
      nullable: true,
    },
    description: { type: 'text', nullable: true },
    linkedTransactionId: {
      name: 'linked_transaction_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    executedAt: {
      name: 'executed_at',
      type: 'timestamptz',
      nullable: true,
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_receipt_order_no',
      columns: ['receiptOrderNo'],
    },
  ],
});

export const departmentEntity = new EntitySchema<Department>({
  name: 'Department',
  tableName: 'department',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    departmentCode: { name: 'department_code', type: 'varchar', length: 64 },
    departmentName: { name: 'department_name', type: 'varchar', length: 255 },
    status: { type: 'varchar', length: 32 },
    description: { type: 'text', nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_department_department_code',
      columns: ['departmentCode'],
    },
  ],
});

export const positionEntity = new EntitySchema<Position>({
  name: 'Position',
  tableName: 'position',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    positionCode: { name: 'position_code', type: 'varchar', length: 64 },
    positionName: { name: 'position_name', type: 'varchar', length: 255 },
    status: { type: 'varchar', length: 32 },
    description: { type: 'text', nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_position_position_code',
      columns: ['positionCode'],
    },
  ],
});

export const employeeEntity = new EntitySchema<Employee>({
  name: 'Employee',
  tableName: 'employee',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    employeeCode: { name: 'employee_code', type: 'varchar', length: 64 },
    employeeName: { name: 'employee_name', type: 'varchar', length: 255 },
    status: { type: 'varchar', length: 32 },
    defaultCurrency: { name: 'default_currency', type: 'varchar', length: 8 },
    description: { type: 'text', nullable: true },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_employee_employee_code',
      columns: ['employeeCode'],
    },
  ],
});

export const employmentEntity = new EntitySchema<Employment>({
  name: 'Employment',
  tableName: 'employment',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    employeeId: { name: 'employee_id', type: 'varchar', length: 64 },
    departmentId: { name: 'department_id', type: 'varchar', length: 64 },
    positionId: { name: 'position_id', type: 'varchar', length: 64 },
    entryDate: {
      name: 'entry_date',
      type: 'date',
      transformer: dateTransformer,
    },
    status: { type: 'varchar', length: 32 },
    isPrimary: { name: 'is_primary', type: 'boolean' },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
  },
});

export const expenseClaimEntity = new EntitySchema<ExpenseClaim>({
  name: 'ExpenseClaim',
  tableName: 'expense_claim',
  columns: {
    id: { type: 'varchar', length: 64, primary: true },
    expenseClaimNo: { name: 'expense_claim_no', type: 'varchar', length: 64 },
    employeeId: { name: 'employee_id', type: 'varchar', length: 64 },
    departmentId: { name: 'department_id', type: 'varchar', length: 64 },
    payFromAccountId: {
      name: 'pay_from_account_id',
      type: 'varchar',
      length: 64,
    },
    expenseAccountId: {
      name: 'expense_account_id',
      type: 'varchar',
      length: 64,
    },
    ledgerBookId: { name: 'ledger_book_id', type: 'varchar', length: 64 },
    amount: {
      type: 'numeric',
      precision: 18,
      scale: 2,
      transformer: numericTransformer,
    },
    currencyCode: { name: 'currency_code', type: 'varchar', length: 8 },
    claimDate: {
      name: 'claim_date',
      type: 'date',
      transformer: dateTransformer,
    },
    purpose: { type: 'varchar', length: 255 },
    status: { type: 'varchar', length: 32 },
    referenceNo: {
      name: 'reference_no',
      type: 'varchar',
      length: 128,
      nullable: true,
    },
    description: { type: 'text', nullable: true },
    linkedPaymentOrderId: {
      name: 'linked_payment_order_id',
      type: 'varchar',
      length: 64,
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      transformer: timestampTransformer,
    },
    executedAt: {
      name: 'executed_at',
      type: 'timestamptz',
      nullable: true,
      transformer: timestampTransformer,
    },
  },
  uniques: [
    {
      name: 'uq_expense_claim_no',
      columns: ['expenseClaimNo'],
    },
  ],
});

export const erpEntities = [
  financialInstitutionEntity,
  ledgerBookEntity,
  financialAccountEntity,
  transactionHeaderEntity,
  transactionLineEntity,
  productEntity,
  vendorEntity,
  vendorBankAccountEntity,
  purchaseOrderEntity,
  goodsReceiptEntity,
  vendorInvoiceEntity,
  paymentOrderEntity,
  customerEntity,
  customerBankAccountEntity,
  receiptOrderEntity,
  departmentEntity,
  positionEntity,
  employeeEntity,
  employmentEntity,
  expenseClaimEntity,
];
