import type { LifecycleStatus, TransactionStatus } from '../fin/types.ts';

export const customerStatuses = ['active', 'inactive'] as const;
export type CustomerStatus = (typeof customerStatuses)[number];

export const receiptOrderStatuses = ['DRAFT', 'EXECUTED', 'CANCELLED'] as const;
export type ReceiptOrderStatus = (typeof receiptOrderStatuses)[number];

export interface Customer {
  id: string;
  customerCode: string;
  customerName: string;
  shortName: string;
  status: CustomerStatus;
  defaultCurrency: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerBankAccount {
  id: string;
  customerId: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  currencyCode: string;
  isDefault: boolean;
  status: LifecycleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptOrder {
  id: string;
  receiptOrderNo: string;
  customerId: string;
  customerBankAccountId: string;
  receiptToAccountId: string;
  revenueAccountId: string;
  ledgerBookId: string;
  amount: number;
  currencyCode: string;
  purpose: string;
  receiptDate: string;
  status: ReceiptOrderStatus;
  referenceNo: string | null;
  description: string | null;
  linkedTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
}

export interface ReceiptExecutionResult {
  receiptOrder: ReceiptOrder;
  transactionStatus: TransactionStatus | null;
}
