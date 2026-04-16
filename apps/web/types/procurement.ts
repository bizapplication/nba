import type { LifecycleStatus } from '~/types/finance'

export type ProductStatus = LifecycleStatus
export type VendorStatus = LifecycleStatus
export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'CANCELLED'
export type GoodsReceiptStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED'
export type VendorInvoiceStatus = 'DRAFT' | 'EXECUTED' | 'CANCELLED'
export type PaymentStatus = 'DRAFT' | 'EXECUTED' | 'CANCELLED'

export interface Product {
  id: string
  productCode: string
  productName: string
  unit: string
  status: ProductStatus
  description: string
  createTime: string
}

export interface Vendor {
  id: string
  vendorCode: string
  vendorName: string
  shortName: string
  status: VendorStatus
  defaultCurrency: string
  description: string
  defaultBankAccountId: string | null
  defaultBankAccountName: string | null
  bankAccountCount: number
  createTime: string
}

export interface VendorBankAccount {
  id: string
  vendorId: string
  vendorName: string | null
  bankName: string
  accountName: string
  accountNo: string
  currency: string
  isDefault: boolean
  status: LifecycleStatus
  createTime: string
}

export interface PurchaseOrder {
  id: string
  purchaseOrderNo: string
  vendorId: string
  vendorName: string | null
  productId: string
  productCode: string | null
  productName: string | null
  quantity: number
  unitPrice: number
  amount: number
  currency: string
  orderDate: string
  status: PurchaseOrderStatus
  referenceNo: string
  description: string
  goodsReceiptCount: number
  invoiceCount: number
  createTime: string
}

export interface GoodsReceipt {
  id: string
  goodsReceiptNo: string
  purchaseOrderId: string
  purchaseOrderNo: string | null
  vendorId: string
  vendorName: string | null
  productId: string
  productCode: string | null
  productName: string | null
  quantity: number
  receiptDate: string
  status: GoodsReceiptStatus
  referenceNo: string
  description: string
  createTime: string
}

export interface VendorInvoice {
  id: string
  vendorInvoiceNo: string
  vendorId: string
  vendorName: string | null
  purchaseOrderId: string
  purchaseOrderNo: string | null
  goodsReceiptId: string | null
  goodsReceiptNo: string | null
  payFromAccountId: string
  payFromAccountName: string | null
  expenseAccountId: string
  expenseAccountName: string | null
  amount: number
  currency: string
  invoiceDate: string
  status: VendorInvoiceStatus
  referenceNo: string
  description: string
  paymentOrderId: string | null
  paymentOrderNo: string | null
  paymentStatus: PaymentStatus | null
  transactionId: string | null
  transactionCode: string | null
  transactionStatus: 'PENDING' | 'POSTED' | 'CANCELLED' | null
  createTime: string
  executedAt: string | null
}

export interface Payment {
  id: string
  paymentOrderNo: string
  vendorId: string | null
  vendorName: string | null
  vendorBankAccountId: string | null
  vendorBankAccountName: string | null
  payFromAccountId: string
  payFromAccountName: string | null
  expenseAccountId: string
  expenseAccountName: string | null
  amount: number
  currency: string
  purpose: string
  paymentDate: string
  status: PaymentStatus
  referenceNo: string
  description: string
  transactionId: string | null
  transactionCode: string | null
  transactionStatus: 'PENDING' | 'POSTED' | 'CANCELLED' | null
  createTime: string
  executedAt: string | null
}

export interface ProductListQuery {
  page?: number
  limit?: number
  search?: string
  status?: ProductStatus
}

export interface VendorListQuery {
  page?: number
  limit?: number
  search?: string
  status?: VendorStatus
  defaultCurrency?: string
}

export interface VendorBankAccountListQuery {
  page?: number
  limit?: number
  search?: string
  vendorId?: string
  status?: LifecycleStatus
  currency?: string
}

export interface PurchaseOrderListQuery {
  page?: number
  limit?: number
  search?: string
  vendorId?: string
  productId?: string
  status?: PurchaseOrderStatus
  dateFrom?: string
  dateTo?: string
}

export interface GoodsReceiptListQuery {
  page?: number
  limit?: number
  search?: string
  purchaseOrderId?: string
  vendorId?: string
  productId?: string
  status?: GoodsReceiptStatus
  dateFrom?: string
  dateTo?: string
}

export interface VendorInvoiceListQuery {
  page?: number
  limit?: number
  search?: string
  vendorId?: string
  purchaseOrderId?: string
  status?: VendorInvoiceStatus
  dateFrom?: string
  dateTo?: string
}

export interface PaymentListQuery {
  page?: number
  limit?: number
  search?: string
  vendorId?: string
  payFromAccountId?: string
  status?: PaymentStatus
  dateFrom?: string
  dateTo?: string
}

export interface ProductFormState {
  productCode: string
  productName: string
  unit: string
  status: ProductStatus
  description: string
}

export interface VendorFormState {
  vendorCode: string
  vendorName: string
  shortName: string
  status: VendorStatus
  defaultCurrency: string
  description: string
}

export interface VendorBankAccountFormState {
  vendorId: string
  bankName: string
  accountName: string
  accountNo: string
  currency: string
  isDefault: boolean
  status: LifecycleStatus
}

export interface PurchaseOrderFormState {
  purchaseOrderNo: string
  vendorId: string
  productId: string
  quantity?: number
  unitPrice?: number
  currency: string
  orderDate: string
  status: PurchaseOrderStatus
  referenceNo: string
  description: string
}

export interface GoodsReceiptFormState {
  goodsReceiptNo: string
  purchaseOrderId: string
  quantity?: number
  receiptDate: string
  status: GoodsReceiptStatus
  referenceNo: string
  description: string
}

export interface VendorInvoiceFormState {
  vendorInvoiceNo: string
  vendorId: string
  purchaseOrderId: string
  goodsReceiptId: string
  payFromAccountId: string
  expenseAccountId: string
  amount?: number
  currency: string
  invoiceDate: string
  status: VendorInvoiceStatus
  referenceNo: string
  description: string
}

export interface PaymentFormState {
  paymentOrderNo: string
  vendorId: string
  vendorBankAccountId: string
  payFromAccountId: string
  expenseAccountId: string
  amount?: number
  currency: string
  purpose: string
  paymentDate: string
  referenceNo: string
  description: string
}
