import type { PaginatedResponse } from '~/types/finance'
import type {
  CrmBaseListQuery,
  CrmCustomer,
  CrmCustomerFormState,
  CrmCustomerListQuery,
  CrmOpportunity,
  CrmOpportunityFormState,
  CrmOpportunityListQuery,
  CrmOrder,
  CrmOrderFormState,
  CrmOrderListQuery,
} from '~/types/crm-domain'

interface CrmListEnvelope<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    pageCount: number
    hasNext: boolean
    hasPrev: boolean
  }
  sort?: {
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
}

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

function toPagedResult<T>(response: CrmListEnvelope<T>): PaginatedResponse<T> {
  return {
    data: response.data,
    total: response.meta.total,
    page: response.meta.page,
    limit: response.meta.pageSize,
  }
}

function toQuery(query: CrmBaseListQuery) {
  const { limit, ...rest } = query

  return {
    ...rest,
    pageSize: limit,
  }
}

export function useCrmDomainApi() {
  const request = async <T>(path: string, options: Record<string, unknown> = {}) => {
    try {
      return await $fetch<T>(`/api/crm${path}`, options)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  return {
    listCustomers: async (query: CrmCustomerListQuery) => {
      const response = await request<CrmListEnvelope<CrmCustomer>>('/customers', { query: toQuery(query) })
      return toPagedResult(response)
    },
    createCustomer: (payload: CrmCustomerFormState) =>
      request<CrmCustomer>('/customers', { method: 'POST', body: payload }),
    updateCustomer: (id: string, payload: Partial<CrmCustomerFormState>) =>
      request<CrmCustomer>(`/customers/${id}`, { method: 'PATCH', body: payload }),
    deleteCustomer: (id: string) =>
      request<{ affected: number }>(`/customers/${id}`, { method: 'DELETE' }),

    listOpportunities: async (query: CrmOpportunityListQuery) => {
      const response = await request<CrmListEnvelope<CrmOpportunity>>('/opportunities', { query: toQuery(query) })
      return toPagedResult(response)
    },
    createOpportunity: (payload: CrmOpportunityFormState) =>
      request<CrmOpportunity>('/opportunities', { method: 'POST', body: payload }),
    updateOpportunity: (id: string, payload: Partial<CrmOpportunityFormState>) =>
      request<CrmOpportunity>(`/opportunities/${id}`, { method: 'PATCH', body: payload }),
    deleteOpportunity: (id: string) =>
      request<{ affected: number }>(`/opportunities/${id}`, { method: 'DELETE' }),

    listOrders: async (query: CrmOrderListQuery) => {
      const response = await request<CrmListEnvelope<CrmOrder>>('/orders', { query: toQuery(query) })
      return toPagedResult(response)
    },
    createOrder: (payload: CrmOrderFormState) =>
      request<CrmOrder>('/orders', { method: 'POST', body: payload }),
    updateOrder: (id: string, payload: Partial<CrmOrderFormState>) =>
      request<CrmOrder>(`/orders/${id}`, { method: 'PATCH', body: payload }),
    deleteOrder: (id: string) =>
      request<{ affected: number }>(`/orders/${id}`, { method: 'DELETE' }),

    toErrorMessage: (error: unknown) => normalizeApiError(error).message,
  }
}
