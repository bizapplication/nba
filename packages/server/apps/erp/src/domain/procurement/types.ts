import type { LifecycleStatus, TransactionStatus } from '../fin/types.ts';

export const vendorStatuses = ['active', 'inactive'] as const;
export type VendorStatus = (typeof vendorStatuses)[number];

export const purchaseOrderStatuses = ['DRAFT', 'ORDERED', 'CANCELLED'] as const;
export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];

export const goodsReceiptStatuses = ['DRAFT', 'RECEIVED', 'CANCELLED'] as const;
export type GoodsReceiptStatus = (typeof goodsReceiptStatuses)[number];

export const vendorInvoiceStatuses = ['DRAFT', 'EXECUTED', 'CANCELLED'] as const;
export type VendorInvoiceStatus = (typeof vendorInvoiceStatuses)[number];

export const paymentOrderStatuses = ['DRAFT', 'EXECUTED', 'CANCELLED'] as const;
export type PaymentOrderStatus = (typeof paymentOrderStatuses)[number];

export const paymentPayeeTypes = ['VENDOR', 'EMPLOYEE'] as const;
export type PaymentPayeeType = (typeof paymentPayeeTypes)[number];

export interface Product {
  id: string;
  productCode: string;
  productName: string;
  unit: string;
  status: LifecycleStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  shortName: string;
  status: VendorStatus;
  defaultCurrency: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorBankAccount {
  id: string;
  vendorId: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  currencyCode: string;
  isDefault: boolean;
  status: LifecycleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  purchaseOrderNo: string;
  vendorId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  currencyCode: string;
  orderDate: string;
  status: PurchaseOrderStatus;
  referenceNo: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceipt {
  id: string;
  goodsReceiptNo: string;
  purchaseOrderId: string;
  vendorId: string;
  productId: string;
  quantity: number;
  receiptDate: string;
  status: GoodsReceiptStatus;
  referenceNo: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorInvoice {
  id: string;
  vendorInvoiceNo: string;
  vendorId: string;
  purchaseOrderId: string;
  goodsReceiptId: string | null;
  payFromAccountId: string;
  expenseAccountId: string;
  ledgerBookId: string;
  amount: number;
  currencyCode: string;
  invoiceDate: string;
  status: VendorInvoiceStatus;
  referenceNo: string | null;
  description: string | null;
  linkedPaymentOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
}

export interface PaymentOrder {
  id: string;
  paymentOrderNo: string;
  payeeType: PaymentPayeeType | null;
  vendorId: string | null;
  vendorBankAccountId: string | null;
  employeeId: string | null;
  payFromAccountId: string;
  expenseAccountId: string;
  ledgerBookId: string;
  amount: number;
  currencyCode: string;
  purpose: string;
  paymentDate: string;
  status: PaymentOrderStatus;
  referenceNo: string | null;
  description: string | null;
  sourceType: string | null;
  sourceId: string | null;
  linkedTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
}

export interface PaymentExecutionResult {
  paymentOrder: PaymentOrder;
  transactionStatus: TransactionStatus | null;
}

export interface VendorInvoiceExecutionResult {
  vendorInvoice: VendorInvoice;
  paymentOrder: PaymentOrder;
  transactionStatus: TransactionStatus | null;
}
