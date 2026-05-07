import type {
  Account,
  AccountFormState,
  AccountListQuery,
  Bank,
  BankFormState,
  BankListQuery,
  Ledger,
  LedgerFormState,
  LedgerListQuery,
  PaginatedResponse,
  Transaction,
  TransactionFormState,
  TransactionListQuery
} from '~/types/finance'

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

export function useFinanceApi() {
  const request = async <T>(path: string, options: Record<string, unknown> = {}) => {
    try {
      return await $fetch<T>(`/api/finance${path}`, options)
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  return {
    listBanks: (query: BankListQuery) =>
      request<PaginatedResponse<Bank>>('/banks', { query }),
    createBank: (payload: BankFormState) =>
      request<Bank>('/banks', { method: 'POST', body: payload }),
    updateBank: (id: string, payload: BankFormState) =>
      request<Bank>(`/banks/${id}`, { method: 'PUT', body: payload }),
    deleteBank: (id: string) =>
      request<{ success: true }>(`/banks/${id}`, { method: 'DELETE' }),

    listLedgers: (query: LedgerListQuery) =>
      request<PaginatedResponse<Ledger>>('/ledgers', { query }),
    createLedger: (payload: LedgerFormState) =>
      request<Ledger>('/ledgers', { method: 'POST', body: payload }),
    updateLedger: (id: string, payload: LedgerFormState) =>
      request<Ledger>(`/ledgers/${id}`, { method: 'PUT', body: payload }),
    deleteLedger: (id: string) =>
      request<{ success: true }>(`/ledgers/${id}`, { method: 'DELETE' }),

    listAccounts: (query: AccountListQuery) =>
      request<PaginatedResponse<Account>>('/accounts', { query }),
    createAccount: (payload: AccountFormState) =>
      request<Account>('/accounts', { method: 'POST', body: payload }),
    updateAccount: (id: string, payload: AccountFormState) =>
      request<Account>(`/accounts/${id}`, { method: 'PUT', body: payload }),
    deleteAccount: (id: string) =>
      request<{ success: true }>(`/accounts/${id}`, { method: 'DELETE' }),

    listTransactions: (query: TransactionListQuery) =>
      request<PaginatedResponse<Transaction>>('/transactions', { query }),
    createTransaction: (payload: TransactionFormState) =>
      request<Transaction>('/transactions', { method: 'POST', body: payload }),
    updateTransaction: (id: string, payload: TransactionFormState) =>
      request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: payload }),
    deleteTransaction: (id: string) =>
      request<{ success: true }>(`/transactions/${id}`, { method: 'DELETE' }),
    postTransaction: (id: string) =>
      request<Transaction>(`/transactions/${id}/post`, { method: 'POST' }),
    unpostTransaction: (id: string) =>
      request<Transaction>(`/transactions/${id}/unpost`, { method: 'POST' }),

    toErrorMessage: (error: unknown) => normalizeApiError(error).message
  }
}
