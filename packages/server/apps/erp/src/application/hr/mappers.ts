import type { TransactionRecord } from '../../domain/fin/types.ts';
import type { PaymentOrder } from '../../domain/procurement/types.ts';
import type {
  Department,
  Employee,
  Employment,
  ExpenseClaim,
  Position,
} from '../../domain/hr/types.ts';
import type {
  DepartmentDto,
  EmployeeDto,
  EmploymentDto,
  ExpenseClaimDto,
  PositionDto,
} from './dto.ts';
import { roundMoney } from '../../shared/money.ts';

export function mapDepartmentToDto(
  department: Department,
  employmentsByDepartmentId: Map<string, Employment[]>,
): DepartmentDto {
  const employments = employmentsByDepartmentId.get(department.id) ?? [];

  return {
    id: department.id,
    departmentCode: department.departmentCode,
    departmentName: department.departmentName,
    status: department.status,
    description: department.description ?? '',
    employeeCount: employments.length,
    createTime: department.createdAt,
  };
}

export function mapPositionToDto(
  position: Position,
  employmentsByPositionId: Map<string, Employment[]>,
): PositionDto {
  const employments = employmentsByPositionId.get(position.id) ?? [];

  return {
    id: position.id,
    positionCode: position.positionCode,
    positionName: position.positionName,
    status: position.status,
    description: position.description ?? '',
    employeeCount: employments.length,
    createTime: position.createdAt,
  };
}

export function mapEmployeeToDto(
  employee: Employee,
  employmentsByEmployeeId: Map<string, Employment[]>,
  departmentsById: Map<string, Department>,
  positionsById: Map<string, Position>,
): EmployeeDto {
  const employments = employmentsByEmployeeId.get(employee.id) ?? [];
  const primaryEmployment =
    employments.find((item) => item.isPrimary) ?? employments[0] ?? null;

  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employee.employeeName,
    status: employee.status,
    defaultCurrency: employee.defaultCurrency,
    description: employee.description ?? '',
    primaryEmploymentId: primaryEmployment?.id ?? null,
    departmentId: primaryEmployment?.departmentId ?? null,
    departmentName: primaryEmployment
      ? (departmentsById.get(primaryEmployment.departmentId)?.departmentName ?? null)
      : null,
    positionId: primaryEmployment?.positionId ?? null,
    positionName: primaryEmployment
      ? (positionsById.get(primaryEmployment.positionId)?.positionName ?? null)
      : null,
    entryDate: primaryEmployment?.entryDate ?? null,
    createTime: employee.createdAt,
  };
}

export function mapEmploymentToDto(
  employment: Employment,
  employeesById: Map<string, Employee>,
  departmentsById: Map<string, Department>,
  positionsById: Map<string, Position>,
): EmploymentDto {
  return {
    id: employment.id,
    employeeId: employment.employeeId,
    employeeName: employeesById.get(employment.employeeId)?.employeeName ?? null,
    departmentId: employment.departmentId,
    departmentName: departmentsById.get(employment.departmentId)?.departmentName ?? null,
    positionId: employment.positionId,
    positionName: positionsById.get(employment.positionId)?.positionName ?? null,
    entryDate: employment.entryDate,
    status: employment.status,
    isPrimary: employment.isPrimary,
    createTime: employment.createdAt,
  };
}

export function mapExpenseClaimToDto(
  expenseClaim: ExpenseClaim,
  employeesById: Map<string, Employee>,
  departmentsById: Map<string, Department>,
  paymentOrdersById: Map<string, PaymentOrder>,
  transactionsById: Map<string, TransactionRecord>,
): ExpenseClaimDto {
  const linkedPaymentOrder = expenseClaim.linkedPaymentOrderId
    ? (paymentOrdersById.get(expenseClaim.linkedPaymentOrderId) ?? null)
    : null;
  const linkedTransaction = linkedPaymentOrder?.linkedTransactionId
    ? (transactionsById.get(linkedPaymentOrder.linkedTransactionId) ?? null)
    : null;

  return {
    id: expenseClaim.id,
    expenseClaimNo: expenseClaim.expenseClaimNo,
    employeeId: expenseClaim.employeeId,
    employeeName: employeesById.get(expenseClaim.employeeId)?.employeeName ?? null,
    departmentId: expenseClaim.departmentId,
    departmentName: departmentsById.get(expenseClaim.departmentId)?.departmentName ?? null,
    amount: roundMoney(expenseClaim.amount),
    currency: expenseClaim.currencyCode,
    claimDate: expenseClaim.claimDate,
    purpose: expenseClaim.purpose,
    status: expenseClaim.status,
    referenceNo: expenseClaim.referenceNo ?? '',
    description: expenseClaim.description ?? '',
    paymentOrderId: linkedPaymentOrder?.id ?? null,
    paymentOrderNo: linkedPaymentOrder?.paymentOrderNo ?? null,
    paymentStatus: linkedPaymentOrder?.status ?? null,
    transactionId: linkedTransaction?.header.id ?? null,
    transactionCode: linkedTransaction?.header.code ?? null,
    transactionStatus: linkedTransaction?.header.status ?? null,
    createTime: expenseClaim.createdAt,
    executedAt: expenseClaim.executedAt,
  };
}
