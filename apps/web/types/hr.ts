import type { LifecycleStatus } from '~/types/finance'

export type DepartmentStatus = LifecycleStatus
export type PositionStatus = LifecycleStatus
export type EmployeeStatus = LifecycleStatus
export type EmploymentStatus = LifecycleStatus
export type ExpenseClaimStatus = 'DRAFT' | 'EXECUTED' | 'CANCELLED'

export interface Department {
  id: string
  departmentCode: string
  departmentName: string
  status: DepartmentStatus
  description: string
  employeeCount: number
  createTime: string
}

export interface Position {
  id: string
  positionCode: string
  positionName: string
  status: PositionStatus
  description: string
  employeeCount: number
  createTime: string
}

export interface Employee {
  id: string
  employeeCode: string
  employeeName: string
  status: EmployeeStatus
  defaultCurrency: string
  description: string
  primaryEmploymentId: string | null
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionName: string | null
  entryDate: string | null
  createTime: string
}

export interface Employment {
  id: string
  employeeId: string
  employeeName: string | null
  departmentId: string
  departmentName: string | null
  positionId: string
  positionName: string | null
  entryDate: string
  status: EmploymentStatus
  isPrimary: boolean
  createTime: string
}

export interface ExpenseClaim {
  id: string
  expenseClaimNo: string
  employeeId: string
  employeeName: string | null
  departmentId: string
  departmentName: string | null
  amount: number
  currency: string
  claimDate: string
  purpose: string
  status: ExpenseClaimStatus
  referenceNo: string
  description: string
  paymentOrderId: string | null
  paymentOrderNo: string | null
  paymentStatus: 'DRAFT' | 'EXECUTED' | 'CANCELLED' | null
  transactionId: string | null
  transactionCode: string | null
  transactionStatus: 'PENDING' | 'POSTED' | 'CANCELLED' | null
  createTime: string
  executedAt: string | null
}

export interface DepartmentListQuery {
  page?: number
  limit?: number
  search?: string
  status?: DepartmentStatus
}

export interface PositionListQuery {
  page?: number
  limit?: number
  search?: string
  status?: PositionStatus
}

export interface EmployeeListQuery {
  page?: number
  limit?: number
  search?: string
  status?: EmployeeStatus
  departmentId?: string
  positionId?: string
}

export interface EmploymentListQuery {
  page?: number
  limit?: number
  search?: string
  employeeId?: string
  departmentId?: string
  positionId?: string
  status?: EmploymentStatus
}

export interface ExpenseClaimListQuery {
  page?: number
  limit?: number
  search?: string
  employeeId?: string
  departmentId?: string
  status?: ExpenseClaimStatus
  dateFrom?: string
  dateTo?: string
}

export interface DepartmentFormState {
  departmentCode: string
  departmentName: string
  status: DepartmentStatus
  description: string
}

export interface PositionFormState {
  positionCode: string
  positionName: string
  status: PositionStatus
  description: string
}

export interface EmployeeFormState {
  employeeCode: string
  employeeName: string
  status: EmployeeStatus
  defaultCurrency: string
  description: string
}

export interface EmploymentFormState {
  employeeId: string
  departmentId: string
  positionId: string
  entryDate: string
  status: EmploymentStatus
  isPrimary: boolean
}

export interface ExpenseClaimFormState {
  expenseClaimNo: string
  employeeId: string
  departmentId: string
  amount?: number
  currency: string
  claimDate: string
  purpose: string
  referenceNo: string
  description: string
}
