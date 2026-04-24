export type CrmOpportunityStage = 'new' | 'qualified' | 'proposal' | 'won' | 'lost'
export type CrmOrderStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'
export type CrmSortOrder = 'asc' | 'desc'

export interface CrmCustomer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  createdAt: string
  updatedAt: string
}

export interface CrmOpportunity {
  id: string
  customerId: string
  customerName: string | null
  title: string
  description: string
  amount: number
  stage: CrmOpportunityStage
  expectedCloseDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CrmOrder {
  id: string
  orderNo: string
  customerId: string
  customerName: string | null
  name: string
  description: string
  amount: number
  status: CrmOrderStatus
  createdAt: string
  updatedAt: string
}

export interface CrmCustomerFormState {
  name: string
  email: string
  phone: string
  company: string
}

export interface CrmOpportunityFormState {
  customerId: string
  title: string
  description: string
  amount?: number
  stage: CrmOpportunityStage
  expectedCloseDate: string
}

export interface CrmOrderFormState {
  orderNo: string
  customerId: string
  name: string
  description: string
  amount?: number
  status: CrmOrderStatus
}

export interface CrmBaseListQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: CrmSortOrder
}

export interface CrmCustomerListQuery extends CrmBaseListQuery {
  keyword?: string
  name?: string
  email?: string
  phone?: string
  company?: string
}

export interface CrmOpportunityListQuery extends CrmBaseListQuery {
  keyword?: string
  customerId?: string
  stage?: CrmOpportunityStage
}

export interface CrmOrderListQuery extends CrmBaseListQuery {
  keyword?: string
  customerId?: string
  status?: CrmOrderStatus
}
