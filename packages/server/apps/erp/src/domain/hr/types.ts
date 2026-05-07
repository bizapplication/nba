import type { PaymentOrderStatus } from '../procurement/types.ts';
import type { LifecycleStatus, TransactionStatus } from '../fin/types.ts';

export const departmentStatuses = ['active', 'inactive'] as const;
export type DepartmentStatus = (typeof departmentStatuses)[number];

export const positionStatuses = ['active', 'inactive'] as const;
export type PositionStatus = (typeof positionStatuses)[number];

export const employeeStatuses = ['active', 'inactive'] as const;
export type EmployeeStatus = (typeof employeeStatuses)[number];

export const employmentStatuses = ['active', 'inactive'] as const;
export type EmploymentStatus = (typeof employmentStatuses)[number];

export const expenseClaimStatuses = ['DRAFT', 'EXECUTED', 'CANCELLED'] as const;
export type ExpenseClaimStatus = (typeof expenseClaimStatuses)[number];

export interface Department {
  id: string;
  departmentCode: string;
  departmentName: string;
  status: DepartmentStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  positionCode: string;
  positionName: string;
  status: PositionStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  employeeName: string;
  status: EmployeeStatus;
  defaultCurrency: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Employment {
  id: string;
  employeeId: string;
  departmentId: string;
  positionId: string;
  entryDate: string;
  status: EmploymentStatus;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseClaim {
  id: string;
  expenseClaimNo: string;
  employeeId: string;
  departmentId: string;
  payFromAccountId: string;
  expenseAccountId: string;
  ledgerBookId: string;
  amount: number;
  currencyCode: string;
  claimDate: string;
  purpose: string;
  status: ExpenseClaimStatus;
  referenceNo: string | null;
  description: string | null;
  linkedPaymentOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
}

export interface ExpenseClaimExecutionResult {
  expenseClaim: ExpenseClaim;
  paymentStatus: PaymentOrderStatus | null;
  transactionStatus: TransactionStatus | null;
}

export type HrLifecycleStatus = LifecycleStatus;
