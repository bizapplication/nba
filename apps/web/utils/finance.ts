import { format } from 'date-fns'

import type {
  AccountStatus,
  AccountType,
  BalanceType,
  FinancialStatus,
  LifecycleStatus,
  LedgerType,
  SelectOption,
  TransactionStatus,
  TransactionType
} from '~/types/finance'

export const financialStatusOptions: SelectOption<FinancialStatus>[] = [
  { label: '启用', value: 'ENABLED' },
  { label: '停用', value: 'DISABLED' },
  { label: '冻结', value: 'FROZEN' }
]

export const lifecycleStatusOptions: SelectOption<LifecycleStatus>[] = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' }
]

export const ledgerTypeOptions: SelectOption<LedgerType>[] = [
  { label: '年度账簿', value: 'ANNUAL' },
  { label: '月度账簿', value: 'MONTHLY' },
  { label: '部门账簿', value: 'DEPARTMENT' },
  { label: '业务账簿', value: 'BUSINESS' }
]

export const accountTypeOptions: SelectOption<AccountType>[] = [
  { label: '资产', value: 'ASSET' },
  { label: '负债', value: 'LIABILITY' },
  { label: '权益', value: 'EQUITY' },
  { label: '收入', value: 'INCOME' },
  { label: '费用', value: 'EXPENSE' }
]

export const balanceTypeOptions: SelectOption<BalanceType>[] = [
  { label: '借方', value: 'DEBIT' },
  { label: '贷方', value: 'CREDIT' }
]

export const accountStatusOptions: SelectOption<AccountStatus>[] = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
  { label: '冻结', value: 'FROZEN' }
]

export const transactionTypeOptions: SelectOption<TransactionType>[] = [
  { label: '支出', value: 'PAYMENT' },
  { label: '收入', value: 'RECEIPT' },
  { label: '转账', value: 'TRANSFER' },
  { label: '手工凭证', value: 'MANUAL_JOURNAL' }
]

export const transactionStatusOptions: SelectOption<TransactionStatus>[] = [
  { label: '待过账', value: 'PENDING' },
  { label: '已过账', value: 'POSTED' },
  { label: '已取消', value: 'CANCELLED' }
]

export const FILTER_ALL_VALUE = '__ALL__'
export const OPTIONAL_NONE_VALUE = '__NONE__'

export const allFilterOption = { label: '全部', value: FILTER_ALL_VALUE } as const

export function toSelectItems<T extends string>(options: SelectOption<T>[]) {
  return [allFilterOption, ...options]
}

export function normalizeFilterValue<T extends string>(value?: T | typeof FILTER_ALL_VALUE | '') {
  if (!value || value === FILTER_ALL_VALUE) {
    return undefined
  }

  return value as T
}

export function createOptionalSelectItem(label: string) {
  return { label, value: OPTIONAL_NONE_VALUE }
}

export function asOptionalSelectValue(value?: string | null) {
  return value || OPTIONAL_NONE_VALUE
}

export function fromOptionalSelectValue(value?: string | null) {
  if (!value || value === OPTIONAL_NONE_VALUE) {
    return ''
  }

  return value
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }

  return format(new Date(value), 'yyyy-MM-dd HH:mm')
}

export function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return format(new Date(value), 'yyyy-MM-dd')
}

export function formatCurrency(value: number, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(value)
}

export function toSignedBalance(value: number, balanceType: BalanceType) {
  return balanceType === 'CREDIT' ? value * -1 : value
}

export function formatSignedBalance(value: number, balanceType: BalanceType, currency = 'CNY') {
  return formatCurrency(toSignedBalance(value, balanceType), currency)
}

export function findOptionLabel<T extends string>(options: SelectOption<T>[], value?: T | null) {
  if (!value) {
    return '-'
  }

  return options.find((option) => option.value === value)?.label || value
}

export function statusColor(status: FinancialStatus | LifecycleStatus | AccountStatus | TransactionStatus) {
  if (status === 'ENABLED' || status === 'active' || status === 'ACTIVE' || status === 'POSTED') {
    return 'success'
  }

  if (status === 'PENDING') {
    return 'warning'
  }

  if (status === 'FROZEN' || status === 'CANCELLED') {
    return 'error'
  }

  return 'neutral'
}

export function deriveBalanceType(type: AccountType): BalanceType {
  if (type === 'LIABILITY' || type === 'EQUITY' || type === 'INCOME') {
    return 'CREDIT'
  }

  return 'DEBIT'
}

export function todayDate() {
  return format(new Date(), 'yyyy-MM-dd')
}
