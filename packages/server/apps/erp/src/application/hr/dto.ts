import type { PaymentOrderStatus } from '../../domain/procurement/types.ts';
import type { TransactionStatus } from '../../domain/fin/types.ts';
import type {
  DepartmentStatus,
  EmployeeStatus,
  EmploymentStatus,
  ExpenseClaimStatus,
  PositionStatus,
} from '../../domain/hr/types.ts';
import type { PaginatedResult } from '../../shared/pagination.ts';

export interface DepartmentDto {
  id: string;
  departmentCode: string;
  departmentName: string;
  status: DepartmentStatus;
  description: string;
  employeeCount: number;
  createTime: string;
}

export interface PositionDto {
  id: string;
  positionCode: string;
  positionName: string;
  status: PositionStatus;
  description: string;
  employeeCount: number;
  createTime: string;
}

export interface EmployeeDto {
  id: string;
  employeeCode: string;
  employeeName: string;
  status: EmployeeStatus;
  defaultCurrency: string;
  description: string;
  primaryEmploymentId: string | null;
  departmentId: string | null;
  departmentName: string | null;
  positionId: string | null;
  positionName: string | null;
  entryDate: string | null;
  createTime: string;
}

export interface EmploymentDto {
  id: string;
  employeeId: string;
  employeeName: string | null;
  departmentId: string;
  departmentName: string | null;
  positionId: string;
  positionName: string | null;
  entryDate: string;
  status: EmploymentStatus;
  isPrimary: boolean;
  createTime: string;
}

export interface ExpenseClaimDto {
  id: string;
  expenseClaimNo: string;
  employeeId: string;
  employeeName: string | null;
  departmentId: string;
  departmentName: string | null;
  amount: number;
  currency: string;
  claimDate: string;
  purpose: string;
  status: ExpenseClaimStatus;
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

export interface DepartmentListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: DepartmentStatus | null;
}

export interface PositionListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: PositionStatus | null;
}

export interface EmployeeListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  status?: EmployeeStatus | null;
  departmentId?: string | null;
  positionId?: string | null;
}

export interface EmploymentListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  employeeId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  status?: EmploymentStatus | null;
}

export interface ExpenseClaimListQuery {
  page?: number | null;
  limit?: number | null;
  search?: string | null;
  employeeId?: string | null;
  departmentId?: string | null;
  status?: ExpenseClaimStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface CreateDepartmentInput {
  departmentCode: string;
  departmentName: string;
  status: DepartmentStatus;
  description?: string | null;
}

export interface UpdateDepartmentInput extends CreateDepartmentInput {}

export interface CreatePositionInput {
  positionCode: string;
  positionName: string;
  status: PositionStatus;
  description?: string | null;
}

export interface UpdatePositionInput extends CreatePositionInput {}

export interface CreateEmployeeInput {
  employeeCode: string;
  employeeName: string;
  status: EmployeeStatus;
  defaultCurrency: string;
  description?: string | null;
}

export interface UpdateEmployeeInput extends CreateEmployeeInput {}

export interface CreateEmploymentInput {
  employeeId: string;
  departmentId: string;
  positionId: string;
  entryDate: string;
  status: EmploymentStatus;
  isPrimary: boolean;
}

export interface UpdateEmploymentInput extends CreateEmploymentInput {}

export interface CreateExpenseClaimInput {
  expenseClaimNo?: string | null;
  employeeId: string;
  departmentId: string;
  amount: number;
  currency: string;
  claimDate: string;
  purpose: string;
  referenceNo?: string | null;
  description?: string | null;
}

export interface UpdateExpenseClaimInput extends CreateExpenseClaimInput {}

export type PaginatedDto<T> = PaginatedResult<T>;
