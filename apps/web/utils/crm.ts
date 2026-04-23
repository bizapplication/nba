import type { LifecycleStatus, SelectOption } from '~/types/finance'
import type { CustomerStatus, ReceiptStatus } from '~/types/crm'
import { lifecycleStatusOptions } from '~/utils/finance'

export const customerStatusOptions: SelectOption<CustomerStatus>[] = lifecycleStatusOptions

export const receiptStatusOptions: SelectOption<ReceiptStatus>[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已执行', value: 'EXECUTED' },
  { label: '已取消', value: 'CANCELLED' }
]

export function crmStatusColor(status: CustomerStatus | LifecycleStatus | ReceiptStatus) {
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
