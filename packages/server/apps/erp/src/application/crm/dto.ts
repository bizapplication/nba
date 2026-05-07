import type { LifecycleStatus, TransactionStatus } from '../../domain/fin/types.ts';
import type {
  CustomerStatus,
  ReceiptOrderStatus,
} from '../../domain/crm/types.ts';
import type { PaginatedResult } from '../../shared/pagination.ts';

export interface CustomerDto {
  id: string;
  customerCode: string;
  customerName: string;
  shortName: string;
  status: CustomerStatus;
  defaultCurrency: string;
  description: string;
  defaultBankAccountId: string | null;
  defaultBankAccountName: string | null;
  bankAccountCount: number;
  createTime: string;
}

export interface CustomerBankAccountDto {
  id: string;
  customerId: string;
  customerName: string | null;
  bankName: string;
  accountName: string;
  accountNo: string;
  currency: string;
  isDefault: boolean;
  status: LifecycleStatus;
  createTime: string;
}

export interface ReceiptDto {
  id: string;
  receiptOrderNo: string;
  customerId: string;
  customerName: string | null;
  customerBankAccountId: string;
  customerBankAccountName: string | null;
  receiptToAccountId: string;
  receiptToAccountName: string | null;
  revenueAccountId: string;
  revenueAccountName: string | null;
  amount: number;
  currency: string;
  purpose: string;
  receiptDate: string;
  status: ReceiptOrderStatus;
  referenceNo: string;
  description: string;
  transactionId: string | null;
  transactionCode: string | null;
  transactionStatus: TransactionStatus | null;
  createTime: string;
  executedAt: string | null;
}

export interface CustomerListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: CustomerStatus | null;
  defaultCurrency?: string | null;
}

export interface CustomerBankAccountListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  customerId?: string | null;
  status?: LifecycleStatus | null;
  currency?: string | null;
}

export interface ReceiptListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  customerId?: string | null;
  receiptToAccountId?: string | null;
  status?: ReceiptOrderStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface CreateCustomerInput {
  customerCode: string;
  customerName: string;
  shortName: string;
  status: CustomerStatus;
  defaultCurrency: string;
  description?: string | null;
}

export interface UpdateCustomerInput extends CreateCustomerInput {}

export interface CreateCustomerBankAccountInput {
  customerId: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  currency: string;
  isDefault: boolean;
  status: LifecycleStatus;
}

export interface UpdateCustomerBankAccountInput extends CreateCustomerBankAccountInput {}

export interface CreateReceiptInput {
  receiptOrderNo?: string | null;
  customerId: string;
  customerBankAccountId: string;
  receiptToAccountId: string;
  revenueAccountId: string;
  amount: number;
  currency: string;
  purpose: string;
  receiptDate: string;
  referenceNo?: string | null;
  description?: string | null;
}

export interface UpdateReceiptInput extends CreateReceiptInput {}

export type PaginatedDto<T> = PaginatedResult<T>;
