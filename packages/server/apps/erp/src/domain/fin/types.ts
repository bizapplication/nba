export const financialStatuses = ['ENABLED', 'DISABLED', 'FROZEN'] as const;
export type FinancialStatus = (typeof financialStatuses)[number];

export const lifecycleStatuses = ['active', 'inactive'] as const;
export type LifecycleStatus = (typeof lifecycleStatuses)[number];

export const ledgerBookTypes = [
  'ANNUAL',
  'MONTHLY',
  'DEPARTMENT',
  'BUSINESS',
] as const;
export type LedgerBookType = (typeof ledgerBookTypes)[number];

export const accountCategories = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
] as const;
export type AccountCategory = (typeof accountCategories)[number];

export const accountUiTypes = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'INCOME',
  'EXPENSE',
] as const;
export type AccountUiType = (typeof accountUiTypes)[number];

export const balanceTypes = ['DEBIT', 'CREDIT'] as const;
export type BalanceType = (typeof balanceTypes)[number];

export const accountStatuses = ['ACTIVE', 'DISABLED', 'FROZEN'] as const;
export type AccountStatus = (typeof accountStatuses)[number];

export const transactionBusinessTypes = [
  'PAYMENT',
  'RECEIPT',
  'TRANSFER',
  'MANUAL_JOURNAL',
] as const;
export type TransactionBusinessType = (typeof transactionBusinessTypes)[number];

export const transactionStatuses = [
  'PENDING',
  'POSTED',
  'CANCELLED',
] as const;
export type TransactionStatus = (typeof transactionStatuses)[number];

export const entryTypes = ['DEBIT', 'CREDIT'] as const;
export type EntryType = (typeof entryTypes)[number];

export interface FinancialInstitution {
  id: string;
  institutionCode: string;
  name: string;
  shortName: string;
  displayName: string;
  institutionType: 'BANK' | 'PSP' | 'CLEARING' | 'CASH';
  externalBankCode: string;
  description: string | null;
  financialStatus: FinancialStatus;
  status: LifecycleStatus;
  countryCode: string | null;
  currencyCodeDefault: string | null;
  partyId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerBook {
  id: string;
  code: string;
  name: string;
  description: string | null;
  bookType: LedgerBookType;
  parentBookId: string | null;
  linkedInstitutionId: string | null;
  baseCurrencyCode: string;
  status: LifecycleStatus;
  legalEntityId: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountCategory: AccountCategory;
  normalBalance: BalanceType;
  currencyCode: string;
  ledgerBookId: string;
  parentAccountId: string | null;
  postingLevel: 'MAIN' | 'SUB';
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
  description: string | null;
}

export interface TransactionHeader {
  id: string;
  code: string;
  businessType: TransactionBusinessType;
  sourceType: string | null;
  sourceId: string | null;
  ledgerBookId: string;
  transactionDate: string;
  description: string | null;
  referenceNo: string | null;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  postedAt: string | null;
  unpostedAt: string | null;
}

export interface TransactionLine {
  id: string;
  transactionId: string;
  entryType: EntryType;
  accountId: string;
  amount: number;
  currencyCode: string;
  lineNo: number;
}

export interface TransactionRecord {
  header: TransactionHeader;
  lines: TransactionLine[];
}
