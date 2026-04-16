import type {
  AccountStatus,
  AccountUiType,
  BalanceType,
  FinancialStatus,
  LedgerBookType,
  LifecycleStatus,
  TransactionBusinessType,
  TransactionStatus,
} from '../../domain/fin/types.ts';
import type { PaginatedResult } from '../../shared/pagination.ts';

export interface BankDto {
  id: string;
  name: string;
  bankCode: string;
  shortName: string;
  description: string;
  financialStatus: FinancialStatus;
  status: LifecycleStatus;
  updatedAt: string;
}

export interface LedgerDto {
  id: string;
  name: string;
  code: string;
  description: string;
  type: LedgerBookType;
  bankId: string | null;
  bankName: string | null;
  parentId: string | null;
  parentName: string | null;
  baseCurrency: string;
  status: LifecycleStatus;
  createTime: string;
}

export interface AccountDto {
  id: string;
  name: string;
  code: string;
  description: string;
  type: AccountUiType;
  balanceType: BalanceType;
  currency: string;
  parentId: string | null;
  parentName: string | null;
  ledgerId: string;
  ledgerName: string | null;
  balance: number;
  status: AccountStatus;
  createTime: string;
}

export interface TransactionDto {
  id: string;
  code: string;
  type: TransactionBusinessType;
  amount: number;
  currency: string;
  debitAccountId: string;
  debitAccountName: string | null;
  creditAccountId: string;
  creditAccountName: string | null;
  ledgerId: string;
  ledgerName: string | null;
  transactionDate: string;
  status: TransactionStatus;
  referenceNo: string;
  description: string;
  createTime: string;
}

export interface CreateBankInput {
  name: string;
  bankCode: string;
  shortName: string;
  description?: string | null;
  financialStatus: FinancialStatus;
  status: LifecycleStatus;
}

export interface UpdateBankInput extends CreateBankInput {}

export interface BankListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: LifecycleStatus | null;
  financialStatus?: FinancialStatus | null;
}

export interface CreateLedgerInput {
  name: string;
  code: string;
  description?: string | null;
  type: LedgerBookType;
  bankId?: string | null;
  baseCurrency: string;
  status: LifecycleStatus;
  parentId?: string | null;
}

export interface UpdateLedgerInput extends CreateLedgerInput {}

export interface LedgerListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: LifecycleStatus | null;
  type?: LedgerBookType | null;
  bankId?: string | null;
  parentId?: string | null;
  baseCurrency?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface CreateAccountInput {
  name: string;
  code: string;
  type: AccountUiType;
  balanceType: BalanceType;
  currency: string;
  parentId?: string | null;
  ledgerId: string;
  status: AccountStatus;
  description?: string | null;
}

export interface UpdateAccountInput extends CreateAccountInput {}

export interface AccountListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: AccountStatus | null;
  type?: AccountUiType | null;
  ledgerId?: string | null;
  parentId?: string | null;
  currency?: string | null;
  balanceType?: BalanceType | null;
}

export interface CreateTransactionInput {
  code?: string | null;
  type: TransactionBusinessType;
  amount: number;
  debitAccountId: string;
  creditAccountId: string;
  ledgerId: string;
  transactionDate: string;
  referenceNo?: string | null;
  description?: string | null;
  currency?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface UpdateTransactionInput extends CreateTransactionInput {}

export interface TransactionListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: TransactionStatus | null;
  type?: TransactionBusinessType | null;
  ledgerId?: string | null;
  debitAccountId?: string | null;
  creditAccountId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export type PaginatedDto<T> = PaginatedResult<T>;
