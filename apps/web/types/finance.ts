export type FinancialStatus = 'ENABLED' | 'DISABLED' | 'FROZEN'
export type LifecycleStatus = 'active' | 'inactive'
export type LedgerType = 'ANNUAL' | 'MONTHLY' | 'DEPARTMENT' | 'BUSINESS'
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
export type BalanceType = 'DEBIT' | 'CREDIT'
export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'FROZEN'
export type TransactionType = 'PAYMENT' | 'RECEIPT' | 'TRANSFER' | 'MANUAL_JOURNAL'
export type TransactionStatus = 'PENDING' | 'POSTED' | 'CANCELLED'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface Bank {
  id: string
  name: string
  bankCode: string
  shortName: string
  description: string
  financialStatus: FinancialStatus
  status: LifecycleStatus
  updatedAt: string
}

export interface Ledger {
  id: string
  name: string
  code: string
  description: string
  type: LedgerType
  bankId: string | null
  bankName: string | null
  parentId: string | null
  parentName: string | null
  baseCurrency: string
  status: LifecycleStatus
  createTime: string
}

export interface Account {
  id: string
  name: string
  code: string
  description: string
  type: AccountType
  balanceType: BalanceType
  currency: string
  parentId: string | null
  parentName: string | null
  ledgerId: string
  ledgerName: string | null
  balance: number
  status: AccountStatus
  createTime: string
}

export interface Transaction {
  id: string
  code: string
  type: TransactionType
  amount: number
  currency: string
  debitAccountId: string
  debitAccountName: string | null
  creditAccountId: string
  creditAccountName: string | null
  ledgerId: string
  ledgerName: string | null
  transactionDate: string
  status: TransactionStatus
  referenceNo: string
  description: string
  createTime: string
}

export interface BankListQuery {
  page?: number
  limit?: number
  search?: string
  financialStatus?: FinancialStatus
  status?: LifecycleStatus
}

export interface LedgerListQuery {
  page?: number
  limit?: number
  search?: string
  type?: LedgerType
  bankId?: string
  parentId?: string
  baseCurrency?: string
  status?: LifecycleStatus
  dateFrom?: string
  dateTo?: string
}

export interface AccountListQuery {
  page?: number
  limit?: number
  search?: string
  type?: AccountType
  ledgerId?: string
  parentId?: string
  currency?: string
  balanceType?: BalanceType
  status?: AccountStatus
}

export interface TransactionListQuery {
  page?: number
  limit?: number
  search?: string
  type?: TransactionType
  status?: TransactionStatus
  ledgerId?: string
  debitAccountId?: string
  creditAccountId?: string
  dateFrom?: string
  dateTo?: string
}

export interface BankFormState {
  name: string
  bankCode: string
  shortName: string
  description: string
  financialStatus: FinancialStatus
  status: LifecycleStatus
}

export interface LedgerFormState {
  name: string
  code: string
  description: string
  type: LedgerType
  bankId: string
  parentId: string
  baseCurrency: string
  status: LifecycleStatus
}

export interface AccountFormState {
  name: string
  code: string
  type: AccountType
  balanceType: BalanceType
  currency: string
  parentId: string
  ledgerId: string
  status: AccountStatus
  description: string
}

export interface TransactionFormState {
  code: string
  ledgerId: string
  transactionDate: string
  type: TransactionType
  amount?: number
  debitAccountId: string
  creditAccountId: string
  description: string
  referenceNo: string
  currency: string
}

export interface SelectOption<T extends string = string> {
  label: string
  value: T
}
