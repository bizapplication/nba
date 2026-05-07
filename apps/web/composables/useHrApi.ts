import type { PaginatedResponse } from '~/types/finance'
import type {
  Department,
  DepartmentFormState,
  DepartmentListQuery,
  Employee,
  EmployeeFormState,
  EmployeeListQuery,
  Employment,
  EmploymentFormState,
  EmploymentListQuery,
  ExpenseClaim,
  ExpenseClaimFormState,
  ExpenseClaimListQuery,
  Position,
  PositionFormState,
  PositionListQuery
} from '~/types/hr'

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

export function useHrApi() {
  const request = async <T>(basePath: string, path = '', options: Record<string, unknown> = {}) => {
    try {
      return await $fetch<T>(`${basePath}${path}`, options)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  return {
    listDepartments: (query: DepartmentListQuery) =>
      request<PaginatedResponse<Department>>('/api/departments', '', { query }),
    createDepartment: (payload: DepartmentFormState) =>
      request<Department>('/api/departments', '', { method: 'POST', body: payload }),
    updateDepartment: (id: string, payload: DepartmentFormState) =>
      request<Department>('/api/departments', `/${id}`, { method: 'PUT', body: payload }),
    deleteDepartment: (id: string) =>
      request<{ success: true }>('/api/departments', `/${id}`, { method: 'DELETE' }),

    listPositions: (query: PositionListQuery) =>
      request<PaginatedResponse<Position>>('/api/positions', '', { query }),
    createPosition: (payload: PositionFormState) =>
      request<Position>('/api/positions', '', { method: 'POST', body: payload }),
    updatePosition: (id: string, payload: PositionFormState) =>
      request<Position>('/api/positions', `/${id}`, { method: 'PUT', body: payload }),
    deletePosition: (id: string) =>
      request<{ success: true }>('/api/positions', `/${id}`, { method: 'DELETE' }),

    listEmployees: (query: EmployeeListQuery) =>
      request<PaginatedResponse<Employee>>('/api/employees', '', { query }),
    createEmployee: (payload: EmployeeFormState) =>
      request<Employee>('/api/employees', '', { method: 'POST', body: payload }),
    updateEmployee: (id: string, payload: EmployeeFormState) =>
      request<Employee>('/api/employees', `/${id}`, { method: 'PUT', body: payload }),
    deleteEmployee: (id: string) =>
      request<{ success: true }>('/api/employees', `/${id}`, { method: 'DELETE' }),

    listEmployments: (query: EmploymentListQuery) =>
      request<PaginatedResponse<Employment>>('/api/employments', '', { query }),
    createEmployment: (payload: EmploymentFormState) =>
      request<Employment>('/api/employments', '', { method: 'POST', body: payload }),
    updateEmployment: (id: string, payload: EmploymentFormState) =>
      request<Employment>('/api/employments', `/${id}`, { method: 'PUT', body: payload }),
    deleteEmployment: (id: string) =>
      request<{ success: true }>('/api/employments', `/${id}`, { method: 'DELETE' }),

    listExpenseClaims: (query: ExpenseClaimListQuery) =>
      request<PaginatedResponse<ExpenseClaim>>('/api/expense-claims', '', { query }),
    createExpenseClaim: (payload: ExpenseClaimFormState) =>
      request<ExpenseClaim>('/api/expense-claims', '', { method: 'POST', body: payload }),
    updateExpenseClaim: (id: string, payload: ExpenseClaimFormState) =>
      request<ExpenseClaim>('/api/expense-claims', `/${id}`, { method: 'PUT', body: payload }),
    deleteExpenseClaim: (id: string) =>
      request<{ success: true }>('/api/expense-claims', `/${id}`, { method: 'DELETE' }),
    executeExpenseClaim: (id: string) =>
      request<ExpenseClaim>('/api/expense-claims', `/${id}/execute`, { method: 'POST' }),

    toErrorMessage: (error: unknown) => normalizeApiError(error).message
  }
}
