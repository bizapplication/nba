import type { PaginatedResponse } from '~/types/finance'
import type {
  GoodsReceipt,
  GoodsReceiptFormState,
  GoodsReceiptListQuery,
  Payment,
  PaymentFormState,
  PaymentListQuery,
  Product,
  ProductFormState,
  ProductListQuery,
  PurchaseOrder,
  PurchaseOrderFormState,
  PurchaseOrderListQuery,
  Vendor,
  VendorBankAccount,
  VendorBankAccountFormState,
  VendorBankAccountListQuery,
  VendorInvoice,
  VendorInvoiceFormState,
  VendorInvoiceListQuery,
  VendorFormState,
  VendorListQuery
} from '~/types/procurement'

function normalizeApiError(error: unknown) {
  const fallbackMessage = '请求失败，请稍后重试。'

  if (!error || typeof error !== 'object') {
    return new Error(fallbackMessage)
  }

  const fetchError = error as {
    data?: { message?: string }
    message?: string
    statusMessage?: string
  }

  return new Error(fetchError.data?.message || fetchError.statusMessage || fetchError.message || fallbackMessage)
}

export function useProcurementApi() {
  const request = async <T>(basePath: string, path = '', options: Record<string, unknown> = {}) => {
    try {
      return await $fetch<T>(`${basePath}${path}`, options)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  return {
    listProducts: (query: ProductListQuery) =>
      request<PaginatedResponse<Product>>('/api/products', '', { query }),
    createProduct: (payload: ProductFormState) =>
      request<Product>('/api/products', '', { method: 'POST', body: payload }),
    updateProduct: (id: string, payload: ProductFormState) =>
      request<Product>('/api/products', `/${id}`, { method: 'PUT', body: payload }),
    deleteProduct: (id: string) =>
      request<{ success: true }>('/api/products', `/${id}`, { method: 'DELETE' }),

    listVendors: (query: VendorListQuery) =>
      request<PaginatedResponse<Vendor>>('/api/vendors', '', { query }),
    createVendor: (payload: VendorFormState) =>
      request<Vendor>('/api/vendors', '', { method: 'POST', body: payload }),
    updateVendor: (id: string, payload: VendorFormState) =>
      request<Vendor>('/api/vendors', `/${id}`, { method: 'PUT', body: payload }),
    deleteVendor: (id: string) =>
      request<{ success: true }>('/api/vendors', `/${id}`, { method: 'DELETE' }),

    listVendorBankAccounts: (query: VendorBankAccountListQuery) =>
      request<PaginatedResponse<VendorBankAccount>>('/api/vendor-bank-accounts', '', { query }),
    createVendorBankAccount: (payload: VendorBankAccountFormState) =>
      request<VendorBankAccount>('/api/vendor-bank-accounts', '', { method: 'POST', body: payload }),
    updateVendorBankAccount: (id: string, payload: VendorBankAccountFormState) =>
      request<VendorBankAccount>('/api/vendor-bank-accounts', `/${id}`, { method: 'PUT', body: payload }),
    deleteVendorBankAccount: (id: string) =>
      request<{ success: true }>('/api/vendor-bank-accounts', `/${id}`, { method: 'DELETE' }),

    listPurchaseOrders: (query: PurchaseOrderListQuery) =>
      request<PaginatedResponse<PurchaseOrder>>('/api/purchase-orders', '', { query }),
    createPurchaseOrder: (payload: PurchaseOrderFormState) =>
      request<PurchaseOrder>('/api/purchase-orders', '', { method: 'POST', body: payload }),
    updatePurchaseOrder: (id: string, payload: PurchaseOrderFormState) =>
      request<PurchaseOrder>('/api/purchase-orders', `/${id}`, { method: 'PUT', body: payload }),
    deletePurchaseOrder: (id: string) =>
      request<{ success: true }>('/api/purchase-orders', `/${id}`, { method: 'DELETE' }),

    listGoodsReceipts: (query: GoodsReceiptListQuery) =>
      request<PaginatedResponse<GoodsReceipt>>('/api/goods-receipts', '', { query }),
    createGoodsReceipt: (payload: GoodsReceiptFormState) =>
      request<GoodsReceipt>('/api/goods-receipts', '', { method: 'POST', body: payload }),
    updateGoodsReceipt: (id: string, payload: GoodsReceiptFormState) =>
      request<GoodsReceipt>('/api/goods-receipts', `/${id}`, { method: 'PUT', body: payload }),
    deleteGoodsReceipt: (id: string) =>
      request<{ success: true }>('/api/goods-receipts', `/${id}`, { method: 'DELETE' }),

    listVendorInvoices: (query: VendorInvoiceListQuery) =>
      request<PaginatedResponse<VendorInvoice>>('/api/vendor-invoices', '', { query }),
    createVendorInvoice: (payload: VendorInvoiceFormState) =>
      request<VendorInvoice>('/api/vendor-invoices', '', { method: 'POST', body: payload }),
    updateVendorInvoice: (id: string, payload: VendorInvoiceFormState) =>
      request<VendorInvoice>('/api/vendor-invoices', `/${id}`, { method: 'PUT', body: payload }),
    deleteVendorInvoice: (id: string) =>
      request<{ success: true }>('/api/vendor-invoices', `/${id}`, { method: 'DELETE' }),
    executeVendorInvoice: (id: string) =>
      request<VendorInvoice>('/api/vendor-invoices', `/${id}/execute`, { method: 'POST' }),

    listPayments: (query: PaymentListQuery) =>
      request<PaginatedResponse<Payment>>('/api/payments', '', { query }),
    createPayment: (payload: PaymentFormState) =>
      request<Payment>('/api/payments', '', { method: 'POST', body: payload }),
    updatePayment: (id: string, payload: PaymentFormState) =>
      request<Payment>('/api/payments', `/${id}`, { method: 'PUT', body: payload }),
    deletePayment: (id: string) =>
      request<{ success: true }>('/api/payments', `/${id}`, { method: 'DELETE' }),
    executePayment: (id: string) =>
      request<Payment>('/api/payments', `/${id}/execute`, { method: 'POST' }),

    toErrorMessage: (error: unknown) => normalizeApiError(error).message
  }
}
