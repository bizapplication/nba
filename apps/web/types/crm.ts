import type { LifecycleStatus } from '~/types/finance'

export type CustomerStatus = LifecycleStatus
export type ReceiptStatus = 'DRAFT' | 'EXECUTED' | 'CANCELLED'

export interface Customer {
  id: string
  customerCode: string
  customerName: string
  shortName: string
  status: CustomerStatus
  defaultCurrency: string
  description: string
  defaultBankAccountId: string | null
  defaultBankAccountName: string | null
  bankAccountCount: number
  createTime: string
}

export interface CustomerBankAccount {
  id: string
  customerId: string
  customerName: string | null
  bankName: string
  accountName: string
  accountNo: string
  currency: string
  isDefault: boolean
  status: LifecycleStatus
  createTime: string
}

export interface Receipt {
  id: string
  receiptOrderNo: string
  customerId: string
  customerName: string | null
  customerBankAccountId: string
  customerBankAccountName: string | null
  receiptToAccountId: string
  receiptToAccountName: string | null
  revenueAccountId: string
  revenueAccountName: string | null
  amount: number
  currency: string
  purpose: string
  receiptDate: string
  status: ReceiptStatus
  referenceNo: string
  description: string
  transactionId: string | null
  transactionCode: string | null
  transactionStatus: 'PENDING' | 'POSTED' | 'CANCELLED' | null
  createTime: string
  executedAt: string | null
}

export interface CustomerListQuery {
  page?: number
  limit?: number
  search?: string
  status?: CustomerStatus
  defaultCurrency?: string
}

export interface CustomerBankAccountListQuery {
  page?: number
  limit?: number
  search?: string
  customerId?: string
  status?: LifecycleStatus
  currency?: string
}

export interface ReceiptListQuery {
  page?: number
  limit?: number
  search?: string
  customerId?: string
  receiptToAccountId?: string
  status?: ReceiptStatus
  dateFrom?: string
  dateTo?: string
}

export interface CustomerFormState {
  customerCode: string
  customerName: string
  shortName: string
  status: CustomerStatus
  defaultCurrency: string
  description: string
}

export interface CustomerBankAccountFormState {
  customerId: string
  bankName: string
  accountName: string
  accountNo: string
  currency: string
  isDefault: boolean
  status: LifecycleStatus
}

export interface ReceiptFormState {
  receiptOrderNo: string
  customerId: string
  customerBankAccountId: string
  receiptToAccountId: string
  revenueAccountId: string
  amount?: number
  currency: string
  purpose: string
  receiptDate: string
  referenceNo: string
  description: string
}
