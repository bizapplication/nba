import type {
  FinancialAccount,
  FinancialInstitution,
  LedgerBook,
  TransactionRecord,
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

export interface MemorySeedData {
  banks: FinancialInstitution[];
  ledgers: LedgerBook[];
  accounts: FinancialAccount[];
  transactions: TransactionRecord[];
  vendors: Vendor[];
  vendorBankAccounts: VendorBankAccount[];
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  vendorInvoices: VendorInvoice[];
  payments: PaymentOrder[];
  customers: Customer[];
  customerBankAccounts: CustomerBankAccount[];
  receipts: ReceiptOrder[];
  departments: Department[];
  positions: Position[];
  employees: Employee[];
  employments: Employment[];
  expenseClaims: ExpenseClaim[];
}

export function createMemorySeedData(): MemorySeedData {
  const createdAt = '2026-03-01T09:00:00.000Z';
  const updatedAt = '2026-03-20T09:00:00.000Z';

  const banks: FinancialInstitution[] = [
    {
      id: 'bank_main_cn',
      institutionCode: 'FI-0001',
      name: 'Industrial and Commercial Bank of China',
      shortName: 'ICBC',
      displayName: 'Industrial and Commercial Bank of China',
      institutionType: 'BANK',
      externalBankCode: 'ICBC',
      description: 'Primary settlement bank',
      financialStatus: 'ENABLED',
      status: 'active',
      countryCode: 'CN',
      currencyCodeDefault: 'CNY',
      partyId: null,
      metadata: null,
      createdAt,
      updatedAt,
    },
    {
      id: 'bank_main_hk',
      institutionCode: 'FI-0002',
      name: 'Bank of China Hong Kong',
      shortName: 'BOCHK',
      displayName: 'Bank of China Hong Kong',
      institutionType: 'BANK',
      externalBankCode: 'BOCHK',
      description: 'Regional treasury bank',
      financialStatus: 'ENABLED',
      status: 'active',
      countryCode: 'HK',
      currencyCodeDefault: 'CNY',
      partyId: null,
      metadata: null,
      createdAt,
      updatedAt,
    },
  ];

  const ledgers: LedgerBook[] = [
    {
      id: 'ledger_cn_main',
      code: 'GL-CN-MAIN',
      name: 'China Main Ledger',
      description: 'Default mainland accounting book',
      bookType: 'ANNUAL',
      parentBookId: null,
      linkedInstitutionId: 'bank_main_cn',
      baseCurrencyCode: 'CNY',
      status: 'active',
      legalEntityId: null,
      effectiveFrom: null,
      effectiveTo: null,
      createdAt,
      updatedAt,
    },
    {
      id: 'ledger_ops',
      code: 'GL-CN-OPS',
      name: 'Operations Ledger',
      description: 'Operations sub ledger',
      bookType: 'DEPARTMENT',
      parentBookId: 'ledger_cn_main',
      linkedInstitutionId: 'bank_main_cn',
      baseCurrencyCode: 'CNY',
      status: 'active',
      legalEntityId: null,
      effectiveFrom: null,
      effectiveTo: null,
      createdAt,
      updatedAt,
    },
  ];

  const accounts: FinancialAccount[] = [
    {
      id: 'acct_cash_main',
      accountCode: '1001',
      accountName: 'Cash at Bank',
      accountCategory: 'ASSET',
      normalBalance: 'DEBIT',
      currencyCode: 'CNY',
      ledgerBookId: 'ledger_cn_main',
      parentAccountId: null,
      postingLevel: 'MAIN',
      accountStatus: 'ACTIVE',
      createdAt,
      updatedAt,
      description: 'Primary cash account',
    },
    {
      id: 'acct_equity_capital',
      accountCode: '3001',
      accountName: 'Paid-in Capital',
      accountCategory: 'EQUITY',
      normalBalance: 'CREDIT',
      currencyCode: 'CNY',
      ledgerBookId: 'ledger_cn_main',
      parentAccountId: null,
      postingLevel: 'MAIN',
      accountStatus: 'ACTIVE',
      createdAt,
      updatedAt,
      description: 'Founding capital',
    },
    {
      id: 'acct_expense_office',
      accountCode: '6602',
      accountName: 'Office Expense',
      accountCategory: 'EXPENSE',
      normalBalance: 'DEBIT',
      currencyCode: 'CNY',
      ledgerBookId: 'ledger_cn_main',
      parentAccountId: null,
      postingLevel: 'MAIN',
      accountStatus: 'ACTIVE',
      createdAt,
      updatedAt,
      description: 'General office expense',
    },
    {
      id: 'acct_revenue_service',
      accountCode: '6001',
      accountName: 'Service Revenue',
      accountCategory: 'REVENUE',
      normalBalance: 'CREDIT',
      currencyCode: 'CNY',
      ledgerBookId: 'ledger_cn_main',
      parentAccountId: null,
      postingLevel: 'MAIN',
      accountStatus: 'ACTIVE',
      createdAt,
      updatedAt,
      description: 'Default service revenue account',
    },
  ];

  const transactions: TransactionRecord[] = [
    {
      header: {
        id: 'txn_seed_posted',
        code: 'TRX-0001',
        businessType: 'MANUAL_JOURNAL',
        sourceType: 'SEED',
        sourceId: 'seed_opening_balance',
        ledgerBookId: 'ledger_cn_main',
        transactionDate: '2026-03-01',
        description: 'Opening balance',
        referenceNo: 'OPEN-2026-001',
        status: 'POSTED',
        createdAt,
        updatedAt,
        postedAt: '2026-03-01T09:00:00.000Z',
        unpostedAt: null,
      },
      lines: [
        {
          id: 'txn_seed_posted_line_1',
          transactionId: 'txn_seed_posted',
          entryType: 'DEBIT',
          accountId: 'acct_cash_main',
          amount: 50000,
          currencyCode: 'CNY',
          lineNo: 1,
        },
        {
          id: 'txn_seed_posted_line_2',
          transactionId: 'txn_seed_posted',
          entryType: 'CREDIT',
          accountId: 'acct_equity_capital',
          amount: 50000,
          currencyCode: 'CNY',
          lineNo: 2,
        },
      ],
    },
    {
      header: {
        id: 'txn_seed_pending',
        code: 'TRX-0002',
        businessType: 'PAYMENT',
        sourceType: 'SEED',
        sourceId: 'seed_office_payment',
        ledgerBookId: 'ledger_cn_main',
        transactionDate: '2026-03-18',
        description: 'Pending office rent payment',
        referenceNo: 'PAY-2026-003',
        status: 'PENDING',
        createdAt,
        updatedAt,
        postedAt: null,
        unpostedAt: null,
      },
      lines: [
        {
          id: 'txn_seed_pending_line_1',
          transactionId: 'txn_seed_pending',
          entryType: 'DEBIT',
          accountId: 'acct_expense_office',
          amount: 1200,
          currencyCode: 'CNY',
          lineNo: 1,
        },
        {
          id: 'txn_seed_pending_line_2',
          transactionId: 'txn_seed_pending',
          entryType: 'CREDIT',
          accountId: 'acct_cash_main',
          amount: 1200,
          currencyCode: 'CNY',
          lineNo: 2,
        },
      ],
    },
  ];

  const vendors: Vendor[] = [
    {
      id: 'vendor_huaxing_services',
      vendorCode: 'VEND-0001',
      vendorName: 'Huaxing Business Services',
      shortName: 'Huaxing',
      status: 'active',
      defaultCurrency: 'CNY',
      description: 'Default services vendor for office operations',
      createdAt,
      updatedAt,
    },
    {
      id: 'vendor_delta_supply',
      vendorCode: 'VEND-0002',
      vendorName: 'Delta Supply Chain Co.',
      shortName: 'Delta',
      status: 'active',
      defaultCurrency: 'CNY',
      description: 'Procurement-side demo vendor',
      createdAt,
      updatedAt,
    },
  ];

  const vendorBankAccounts: VendorBankAccount[] = [
    {
      id: 'vendor_bank_huaxing_default',
      vendorId: 'vendor_huaxing_services',
      bankName: 'Bank of China Shanghai Branch',
      accountName: 'Huaxing Business Services',
      accountNo: '6222001234567890',
      currencyCode: 'CNY',
      isDefault: true,
      status: 'active',
      createdAt,
      updatedAt,
    },
    {
      id: 'vendor_bank_huaxing_secondary',
      vendorId: 'vendor_huaxing_services',
      bankName: 'China Merchants Bank Pudong Branch',
      accountName: 'Huaxing Business Services',
      accountNo: '9555500001234567',
      currencyCode: 'CNY',
      isDefault: false,
      status: 'active',
      createdAt,
      updatedAt,
    },
    {
      id: 'vendor_bank_delta_default',
      vendorId: 'vendor_delta_supply',
      bankName: 'Industrial Bank Shanghai Branch',
      accountName: 'Delta Supply Chain Co.',
      accountNo: '621700888866667777',
      currencyCode: 'CNY',
      isDefault: true,
      status: 'active',
      createdAt,
      updatedAt,
    },
  ];

  const products: Product[] = [
    {
      id: 'product_office_chair',
      productCode: 'PROD-0001',
      productName: 'Ergonomic Office Chair',
      unit: 'EA',
      status: 'active',
      description: 'Procurement demo product for office furniture purchases',
      createdAt,
      updatedAt,
    },
    {
      id: 'product_network_router',
      productCode: 'PROD-0002',
      productName: 'Enterprise Network Router',
      unit: 'EA',
      status: 'active',
      description: 'Secondary demo product for IT equipment purchases',
      createdAt,
      updatedAt,
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'purchase_order_seed_ordered',
      purchaseOrderNo: 'PO-0001',
      vendorId: 'vendor_delta_supply',
      productId: 'product_office_chair',
      quantity: 10,
      unitPrice: 320,
      amount: 3200,
      currencyCode: 'CNY',
      orderDate: '2026-03-26',
      status: 'ORDERED',
      referenceNo: 'PO-DEMO-001',
      description: 'Seeded purchase order for Phase 5 procurement demo',
      createdAt,
      updatedAt,
    },
  ];

  const goodsReceipts: GoodsReceipt[] = [
    {
      id: 'goods_receipt_seed_received',
      goodsReceiptNo: 'GR-0001',
      purchaseOrderId: 'purchase_order_seed_ordered',
      vendorId: 'vendor_delta_supply',
      productId: 'product_office_chair',
      quantity: 10,
      receiptDate: '2026-03-27',
      status: 'RECEIVED',
      referenceNo: 'GR-DEMO-001',
      description: 'Seeded goods receipt for Phase 5 procurement demo',
      createdAt,
      updatedAt,
    },
  ];

  const vendorInvoices: VendorInvoice[] = [
    {
      id: 'vendor_invoice_seed_draft',
      vendorInvoiceNo: 'INV-0001',
      vendorId: 'vendor_delta_supply',
      purchaseOrderId: 'purchase_order_seed_ordered',
      goodsReceiptId: 'goods_receipt_seed_received',
      payFromAccountId: 'acct_cash_main',
      expenseAccountId: 'acct_expense_office',
      ledgerBookId: 'ledger_cn_main',
      amount: 3200,
      currencyCode: 'CNY',
      invoiceDate: '2026-03-28',
      status: 'DRAFT',
      referenceNo: 'INV-DEMO-001',
      description: 'Seeded vendor invoice for Phase 5 procurement demo',
      linkedPaymentOrderId: null,
      createdAt,
      updatedAt,
      executedAt: null,
    },
  ];

  const payments: PaymentOrder[] = [
    {
      id: 'payment_seed_draft',
      paymentOrderNo: 'PMT-0001',
      payeeType: 'VENDOR',
      vendorId: 'vendor_huaxing_services',
      vendorBankAccountId: 'vendor_bank_huaxing_default',
      employeeId: null,
      payFromAccountId: 'acct_cash_main',
      expenseAccountId: 'acct_expense_office',
      ledgerBookId: 'ledger_cn_main',
      amount: 3200,
      currencyCode: 'CNY',
      purpose: 'March office service fee',
      paymentDate: '2026-03-28',
      status: 'DRAFT',
      referenceNo: 'PMT-DEMO-001',
      description: 'Seeded payment order for Phase 2 demo',
      sourceType: 'UI',
      sourceId: null,
      linkedTransactionId: null,
      createdAt,
      updatedAt,
      executedAt: null,
    },
  ];

  const customers: Customer[] = [
    {
      id: 'customer_aurora_retail',
      customerCode: 'CUST-0001',
      customerName: 'Aurora Retail Group',
      shortName: 'Aurora',
      status: 'active',
      defaultCurrency: 'CNY',
      description: 'Default customer for Phase 3 receipt demo',
      createdAt,
      updatedAt,
    },
    {
      id: 'customer_summit_commerce',
      customerCode: 'CUST-0002',
      customerName: 'Summit Commerce Ltd.',
      shortName: 'Summit',
      status: 'active',
      defaultCurrency: 'CNY',
      description: 'Secondary demo customer for customer master data',
      createdAt,
      updatedAt,
    },
  ];

  const customerBankAccounts: CustomerBankAccount[] = [
    {
      id: 'customer_bank_aurora_default',
      customerId: 'customer_aurora_retail',
      bankName: 'China Construction Bank Shenzhen Branch',
      accountName: 'Aurora Retail Group',
      accountNo: '621700123450000001',
      currencyCode: 'CNY',
      isDefault: true,
      status: 'active',
      createdAt,
      updatedAt,
    },
    {
      id: 'customer_bank_aurora_secondary',
      customerId: 'customer_aurora_retail',
      bankName: 'Ping An Bank Nanshan Branch',
      accountName: 'Aurora Retail Group',
      accountNo: '622202888866660001',
      currencyCode: 'CNY',
      isDefault: false,
      status: 'active',
      createdAt,
      updatedAt,
    },
    {
      id: 'customer_bank_summit_default',
      customerId: 'customer_summit_commerce',
      bankName: 'Bank of Communications Suzhou Branch',
      accountName: 'Summit Commerce Ltd.',
      accountNo: '622260777755551111',
      currencyCode: 'CNY',
      isDefault: true,
      status: 'active',
      createdAt,
      updatedAt,
    },
  ];

  const receipts: ReceiptOrder[] = [
    {
      id: 'receipt_seed_draft',
      receiptOrderNo: 'RCT-0001',
      customerId: 'customer_aurora_retail',
      customerBankAccountId: 'customer_bank_aurora_default',
      receiptToAccountId: 'acct_cash_main',
      revenueAccountId: 'acct_revenue_service',
      ledgerBookId: 'ledger_cn_main',
      amount: 6800,
      currencyCode: 'CNY',
      purpose: 'March service collection',
      receiptDate: '2026-03-29',
      status: 'DRAFT',
      referenceNo: 'RCT-DEMO-001',
      description: 'Seeded receipt order for Phase 3 demo',
      linkedTransactionId: null,
      createdAt,
      updatedAt,
      executedAt: null,
    },
  ];

  const departments: Department[] = [
    {
      id: 'department_finance',
      departmentCode: 'DEPT-0001',
      departmentName: 'Finance',
      status: 'active',
      description: 'Finance shared services department',
      createdAt,
      updatedAt,
    },
    {
      id: 'department_operations',
      departmentCode: 'DEPT-0002',
      departmentName: 'Operations',
      status: 'active',
      description: 'Operations and administration department',
      createdAt,
      updatedAt,
    },
  ];

  const positions: Position[] = [
    {
      id: 'position_accountant',
      positionCode: 'POS-0001',
      positionName: 'Accountant',
      status: 'active',
      description: 'Handles daily accounting and reimbursements',
      createdAt,
      updatedAt,
    },
    {
      id: 'position_operations_specialist',
      positionCode: 'POS-0002',
      positionName: 'Operations Specialist',
      status: 'active',
      description: 'Supports office operations',
      createdAt,
      updatedAt,
    },
  ];

  const employees: Employee[] = [
    {
      id: 'employee_li_wei',
      employeeCode: 'EMP-0001',
      employeeName: 'Li Wei',
      status: 'active',
      defaultCurrency: 'CNY',
      description: 'Primary demo employee for Phase 4 expense claims',
      createdAt,
      updatedAt,
    },
    {
      id: 'employee_chen_xin',
      employeeCode: 'EMP-0002',
      employeeName: 'Chen Xin',
      status: 'active',
      defaultCurrency: 'CNY',
      description: 'Secondary demo employee',
      createdAt,
      updatedAt,
    },
  ];

  const employments: Employment[] = [
    {
      id: 'employment_li_wei_finance',
      employeeId: 'employee_li_wei',
      departmentId: 'department_finance',
      positionId: 'position_accountant',
      entryDate: '2025-11-01',
      status: 'active',
      isPrimary: true,
      createdAt,
      updatedAt,
    },
    {
      id: 'employment_chen_xin_operations',
      employeeId: 'employee_chen_xin',
      departmentId: 'department_operations',
      positionId: 'position_operations_specialist',
      entryDate: '2025-12-15',
      status: 'active',
      isPrimary: true,
      createdAt,
      updatedAt,
    },
  ];

  const expenseClaims: ExpenseClaim[] = [
    {
      id: 'expense_claim_seed_draft',
      expenseClaimNo: 'EXP-0001',
      employeeId: 'employee_li_wei',
      departmentId: 'department_finance',
      payFromAccountId: 'acct_cash_main',
      expenseAccountId: 'acct_expense_office',
      ledgerBookId: 'ledger_cn_main',
      amount: 860,
      currencyCode: 'CNY',
      claimDate: '2026-03-30',
      purpose: 'Team reimbursement for office supplies',
      status: 'DRAFT',
      referenceNo: 'EXP-DEMO-001',
      description: 'Seeded expense claim for Phase 4 demo',
      linkedPaymentOrderId: null,
      createdAt,
      updatedAt,
      executedAt: null,
    },
  ];

  return {
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
  };
}
