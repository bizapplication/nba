import type { LifecycleStatus, SelectOption } from '~/types/finance'
import type {
  DepartmentStatus,
  EmployeeStatus,
  EmploymentStatus,
  ExpenseClaimStatus,
  PositionStatus
} from '~/types/hr'
import { lifecycleStatusOptions } from '~/utils/finance'

export const departmentStatusOptions: SelectOption<DepartmentStatus>[] = lifecycleStatusOptions
export const positionStatusOptions: SelectOption<PositionStatus>[] = lifecycleStatusOptions
export const employeeStatusOptions: SelectOption<EmployeeStatus>[] = lifecycleStatusOptions
export const employmentStatusOptions: SelectOption<EmploymentStatus>[] = lifecycleStatusOptions

export const expenseClaimStatusOptions: SelectOption<ExpenseClaimStatus>[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已执行', value: 'EXECUTED' },
  { label: '已取消', value: 'CANCELLED' }
]

export function hrStatusColor(
  status: DepartmentStatus | PositionStatus | EmployeeStatus | EmploymentStatus | LifecycleStatus | ExpenseClaimStatus
) {
  if (status === 'active' || status === 'EXECUTED') {
    return 'success'
  }

  if (status === 'DRAFT') {
    return 'warning'
  }

  if (status === 'CANCELLED') {
    return 'error'
  }

  return 'neutral'
}
