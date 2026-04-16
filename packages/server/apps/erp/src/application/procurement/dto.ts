import type { LifecycleStatus, TransactionStatus } from '../../domain/fin/types.ts';
import type {
  GoodsReceiptStatus,
  PaymentOrderStatus,
  PurchaseOrderStatus,
  VendorStatus,
  VendorInvoiceStatus,
} from '../../domain/procurement/types.ts';
import type { PaginatedResult } from '../../shared/pagination.ts';

export interface ProductDto {
  id: string;
  productCode: string;
  productName: string;
  unit: string;
  status: LifecycleStatus;
  description: string;
  createTime: string;
}

export interface VendorDto {
  id: string;
  vendorCode: string;
  vendorName: string;
  shortName: string;
  status: VendorStatus;
  defaultCurrency: string;
  description: string;
  defaultBankAccountId: string | null;
  defaultBankAccountName: string | null;
  bankAccountCount: number;
  createTime: string;
}

export interface VendorBankAccountDto {
  id: string;
  vendorId: string;
  vendorName: string | null;
  bankName: string;
  accountName: string;
  accountNo: string;
  currency: string;
  isDefault: boolean;
  status: LifecycleStatus;
  createTime: string;
}

export interface PurchaseOrderDto {
  id: string;
  purchaseOrderNo: string;
  vendorId: string;
  vendorName: string | null;
  productId: string;
  productCode: string | null;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  currency: string;
  orderDate: string;
  status: PurchaseOrderStatus;
  referenceNo: string;
  description: string;
  goodsReceiptCount: number;
  invoiceCount: number;
  createTime: string;
}

export interface GoodsReceiptDto {
  id: string;
  goodsReceiptNo: string;
  purchaseOrderId: string;
  purchaseOrderNo: string | null;
  vendorId: string;
  vendorName: string | null;
  productId: string;
  productCode: string | null;
  productName: string | null;
  quantity: number;
  receiptDate: string;
  status: GoodsReceiptStatus;
  referenceNo: string;
  description: string;
  createTime: string;
}

export interface VendorInvoiceDto {
  id: string;
  vendorInvoiceNo: string;
  vendorId: string;
  vendorName: string | null;
  purchaseOrderId: string;
  purchaseOrderNo: string | null;
  goodsReceiptId: string | null;
  goodsReceiptNo: string | null;
  payFromAccountId: string;
  payFromAccountName: string | null;
  expenseAccountId: string;
  expenseAccountName: string | null;
  amount: number;
  currency: string;
  invoiceDate: string;
  status: VendorInvoiceStatus;
  referenceNo: string;
  description: string;
  paymentOrderId: string | null;
  paymentOrderNo: string | null;
  paymentStatus: PaymentOrderStatus | null;
  transactionId: string | null;
  transactionCode: string | null;
  transactionStatus: TransactionStatus | null;
  createTime: string;
  executedAt: string | null;
}

export interface PaymentDto {
  id: string;
  paymentOrderNo: string;
  vendorId: string | null;
  vendorName: string | null;
  vendorBankAccountId: string | null;
  vendorBankAccountName: string | null;
  payFromAccountId: string;
  payFromAccountName: string | null;
  expenseAccountId: string;
  expenseAccountName: string | null;
  amount: number;
  currency: string;
  purpose: string;
  paymentDate: string;
  status: PaymentOrderStatus;
  referenceNo: string;
  description: string;
  transactionId: string | null;
  transactionCode: string | null;
  transactionStatus: TransactionStatus | null;
  createTime: string;
  executedAt: string | null;
}

export interface ProductListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: LifecycleStatus | null;
}

export interface VendorListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: VendorStatus | null;
  defaultCurrency?: string | null;
}

export interface PurchaseOrderListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  vendorId?: string | null;
  productId?: string | null;
  status?: PurchaseOrderStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface GoodsReceiptListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  purchaseOrderId?: string | null;
  vendorId?: string | null;
  productId?: string | null;
  status?: GoodsReceiptStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface VendorInvoiceListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  vendorId?: string | null;
  purchaseOrderId?: string | null;
  status?: VendorInvoiceStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface VendorBankAccountListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  vendorId?: string | null;
  status?: LifecycleStatus | null;
  currency?: string | null;
}

export interface PaymentListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  vendorId?: string | null;
  payFromAccountId?: string | null;
  status?: PaymentOrderStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface CreateProductInput {
  productCode: string;
  productName: string;
  unit: string;
  status: LifecycleStatus;
  description?: string | null;
}

export interface UpdateProductInput extends CreateProductInput {}

export interface CreateVendorInput {
  vendorCode: string;
  vendorName: string;
  shortName: string;
  status: VendorStatus;
  defaultCurrency: string;
  description?: string | null;
}

export interface UpdateVendorInput extends CreateVendorInput {}

export interface CreateVendorBankAccountInput {
  vendorId: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  currency: string;
  isDefault: boolean;
  status: LifecycleStatus;
}

export interface UpdateVendorBankAccountInput extends CreateVendorBankAccountInput {}

export interface CreatePurchaseOrderInput {
  purchaseOrderNo?: string | null;
  vendorId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  orderDate: string;
  status: PurchaseOrderStatus;
  referenceNo?: string | null;
  description?: string | null;
}

export interface UpdatePurchaseOrderInput extends CreatePurchaseOrderInput {}

export interface CreateGoodsReceiptInput {
  goodsReceiptNo?: string | null;
  purchaseOrderId: string;
  quantity: number;
  receiptDate: string;
  status: GoodsReceiptStatus;
  referenceNo?: string | null;
  description?: string | null;
}

export interface UpdateGoodsReceiptInput extends CreateGoodsReceiptInput {}

export interface CreateVendorInvoiceInput {
  vendorInvoiceNo?: string | null;
  vendorId: string;
  purchaseOrderId: string;
  goodsReceiptId?: string | null;
  payFromAccountId: string;
  expenseAccountId: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  status: VendorInvoiceStatus;
  referenceNo?: string | null;
  description?: string | null;
}

export interface UpdateVendorInvoiceInput extends CreateVendorInvoiceInput {}

export interface CreatePaymentInput {
  paymentOrderNo?: string | null;
  vendorId: string;
  vendorBankAccountId: string;
  payFromAccountId: string;
  expenseAccountId: string;
  amount: number;
  currency: string;
  purpose: string;
  paymentDate: string;
  referenceNo?: string | null;
  description?: string | null;
}

export interface UpdatePaymentInput extends CreatePaymentInput {}

export type PaginatedDto<T> = PaginatedResult<T>;
