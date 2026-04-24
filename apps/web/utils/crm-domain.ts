import type { SelectOption } from '~/types/finance'
import type { CrmOpportunityStage, CrmOrderStatus } from '~/types/crm-domain'

export const crmOpportunityStageOptions: SelectOption<CrmOpportunityStage>[] = [
  { label: '新建', value: 'new' },
  { label: '已识别', value: 'qualified' },
  { label: '方案中', value: 'proposal' },
  { label: '已赢单', value: 'won' },
  { label: '已输单', value: 'lost' },
]

export const crmOrderStatusOptions: SelectOption<CrmOrderStatus>[] = [
  { label: '草稿', value: 'draft' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

export function crmOpportunityStageColor(stage: CrmOpportunityStage) {
  if (stage === 'won') {
    return 'success'
  }

  if (stage === 'proposal') {
    return 'warning'
  }

  if (stage === 'lost') {
    return 'error'
  }

  if (stage === 'qualified') {
    return 'primary'
  }

  return 'neutral'
}

export function crmOrderStatusColor(status: CrmOrderStatus) {
  if (status === 'completed') {
    return 'success'
  }

  if (status === 'confirmed') {
    return 'primary'
  }

  if (status === 'cancelled') {
    return 'error'
  }

  return 'warning'
}
