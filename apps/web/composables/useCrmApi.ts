import type { PaginatedResponse } from '~/types/finance'
import type {
  Customer,
  CustomerBankAccount,
  CustomerBankAccountFormState,
  CustomerBankAccountListQuery,
  CustomerFormState,
  CustomerListQuery,
  Receipt,
  ReceiptFormState,
  ReceiptListQuery
} from '~/types/crm'

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

export function useCrmApi() {
  const request = async <T>(basePath: string, path = '', options: Record<string, unknown> = {}) => {
    try {
      return await $fetch<T>(`${basePath}${path}`, options)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  return {
    listCustomers: (query: CustomerListQuery) =>
      request<PaginatedResponse<Customer>>('/api/customers', '', { query }),
    createCustomer: (payload: CustomerFormState) =>
      request<Customer>('/api/customers', '', { method: 'POST', body: payload }),
    updateCustomer: (id: string, payload: CustomerFormState) =>
      request<Customer>('/api/customers', `/${id}`, { method: 'PUT', body: payload }),
    deleteCustomer: (id: string) =>
      request<{ success: true }>('/api/customers', `/${id}`, { method: 'DELETE' }),

    listCustomerBankAccounts: (query: CustomerBankAccountListQuery) =>
      request<PaginatedResponse<CustomerBankAccount>>('/api/customer-bank-accounts', '', { query }),
    createCustomerBankAccount: (payload: CustomerBankAccountFormState) =>
      request<CustomerBankAccount>('/api/customer-bank-accounts', '', { method: 'POST', body: payload }),
    updateCustomerBankAccount: (id: string, payload: CustomerBankAccountFormState) =>
      request<CustomerBankAccount>('/api/customer-bank-accounts', `/${id}`, { method: 'PUT', body: payload }),
    deleteCustomerBankAccount: (id: string) =>
      request<{ success: true }>('/api/customer-bank-accounts', `/${id}`, { method: 'DELETE' }),

    listReceipts: (query: ReceiptListQuery) =>
      request<PaginatedResponse<Receipt>>('/api/receipts', '', { query }),
    createReceipt: (payload: ReceiptFormState) =>
      request<Receipt>('/api/receipts', '', { method: 'POST', body: payload }),
    updateReceipt: (id: string, payload: ReceiptFormState) =>
      request<Receipt>('/api/receipts', `/${id}`, { method: 'PUT', body: payload }),
    deleteReceipt: (id: string) =>
      request<{ success: true }>('/api/receipts', `/${id}`, { method: 'DELETE' }),
    executeReceipt: (id: string) =>
      request<Receipt>('/api/receipts', `/${id}/execute`, { method: 'POST' }),

    toErrorMessage: (error: unknown) => normalizeApiError(error).message
  }
}
