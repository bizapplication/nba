<script setup lang="ts">
import { z } from 'zod'

import type {
  CrmCustomer,
  CrmOpportunity,
  CrmOpportunityFormState,
  CrmOpportunityStage,
} from '~/types/crm-domain'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems,
} from '~/utils/finance'
import { crmOpportunityStageColor, crmOpportunityStageOptions } from '~/utils/crm-domain'

const api = useCrmDomainApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<CrmOpportunity[]>([])
const customerOptions = ref<CrmCustomer[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const stageFilter = ref<CrmOpportunityStage | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const customerFilter = ref(FILTER_ALL_VALUE)

let searchTimer: ReturnType<typeof setTimeout> | undefined

const stageItems = toSelectItems(crmOpportunityStageOptions)

const opportunitySchema = z.object({
  customerId: z.string().min(1, '请选择客户'),
  title: z.string().min(1, '请输入商机标题'),
  description: z.string().min(1, '请输入商机描述'),
  amount: z.number().positive('请输入大于 0 的金额'),
  stage: z.enum(['new', 'qualified', 'proposal', 'won', 'lost']),
  expectedCloseDate: z.string().optional(),
})

const opportunityForm = reactive<CrmOpportunityFormState>(createOpportunityForm())

const columns = [
  { accessorKey: 'title', header: '商机标题' },
  { accessorKey: 'customerName', header: '客户' },
  { accessorKey: 'amount', header: '金额' },
  { accessorKey: 'stage', header: '阶段' },
  { accessorKey: 'expectedCloseDate', header: '预计成交时间' },
  { accessorKey: 'updatedAt', header: '更新时间' },
  { id: 'actions', header: '操作' }
]

const isReadonly = computed(() => formMode.value === 'view')

const modalTitle = computed(() => {
  if (formMode.value === 'view') {
    return '商机详情'
  }

  if (formMode.value === 'edit') {
    return '编辑商机'
  }

  return '新增商机'
})

const customerItems = computed(() => customerOptions.value.map((customer) => ({
  label: `${customer.name} / ${customer.company}`,
  value: customer.id,
})))

const customerFilterItems = computed(() => [
  { label: '全部客户', value: FILTER_ALL_VALUE },
  ...customerItems.value,
])

function createOpportunityForm(): CrmOpportunityFormState {
  return {
    customerId: '',
    title: '',
    description: '',
    amount: undefined,
    stage: 'new',
    expectedCloseDate: '',
  }
}

function assignForm(opportunity: CrmOpportunity) {
  Object.assign(opportunityForm, {
    customerId: opportunity.customerId,
    title: opportunity.title,
    description: opportunity.description,
    amount: opportunity.amount,
    stage: opportunity.stage,
    expectedCloseDate: opportunity.expectedCloseDate ? opportunity.expectedCloseDate.slice(0, 10) : '',
  })
}

async function loadCustomers() {
  const result = await api.listCustomers({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  customerOptions.value = result.data
}

async function loadOpportunities() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listOpportunities({
      page: page.value,
      limit,
      keyword: search.value || undefined,
      stage: normalizeFilterValue(stageFilter.value),
      customerId: normalizeFilterValue(customerFilter.value),
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })

    rows.value = result.data
    total.value = result.total
  } catch (error) {
    errorMessage.value = api.toErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(opportunityForm, createOpportunityForm())
  opportunityForm.customerId = customerOptions.value[0]?.id || ''
}

function openCreateModal() {
  if (!customerOptions.value.length) {
    toast.add({
      title: '请先创建客户',
      description: '商机需要绑定客户后才能创建。',
      color: 'warning'
    })
    return
  }

  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(opportunity: CrmOpportunity) {
  formMode.value = 'edit'
  editingId.value = opportunity.id
  assignForm(opportunity)
  open.value = true
}

function openViewModal(opportunity: CrmOpportunity) {
  formMode.value = 'view'
  editingId.value = opportunity.id
  assignForm(opportunity)
  open.value = true
}

async function submitOpportunity() {
  submitting.value = true

  try {
    const payload = {
      ...opportunityForm,
      expectedCloseDate: opportunityForm.expectedCloseDate || '',
    }

    if (formMode.value === 'edit' && editingId.value) {
      await api.updateOpportunity(editingId.value, payload)
      toast.add({ title: '商机已更新', color: 'success' })
    } else {
      await api.createOpportunity(payload)
      toast.add({ title: '商机已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadOpportunities()
  } catch (error) {
    toast.add({
      title: formMode.value === 'edit' ? '更新失败' : '创建失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}

async function removeOpportunity(opportunity: CrmOpportunity) {
  if (!window.confirm(`确认删除商机“${opportunity.title}”吗？`)) {
    return
  }

  try {
    await api.deleteOpportunity(opportunity.id)
    toast.add({ title: '商机已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadOpportunities()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(opportunity: CrmOpportunity): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(opportunity)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(opportunity)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeOpportunity(opportunity)
      }
    }
  ]]
}

watch(page, () => {
  void loadOpportunities()
})

watch([stageFilter, customerFilter], () => {
  page.value = 1
  void loadOpportunities()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadOpportunities()
  }, 250)
})

onMounted(async () => {
  await loadCustomers()
  await loadOpportunities()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #default>
          <div>
            <p class="text-base font-semibold text-highlighted">
              商机管理
            </p>
            <p class="text-sm text-muted">
              跟踪销售机会阶段、预计成交时间与金额
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" :disabled="!customerOptions.length" @click="openCreateModal">
            新增商机
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索商机标题或描述" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="customerFilter"
              :items="customerFilterItems"
              value-key="value"
              label-key="label"
              placeholder="客户"
              class="min-w-56"
            />
            <USelect
              v-model="stageFilter"
              :items="stageItems"
              value-key="value"
              label-key="label"
              placeholder="阶段"
              class="min-w-40"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadOpportunities">
              刷新
            </UButton>
          </div>
        </div>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :description="errorMessage"
        />

        <UCard>
          <div class="space-y-4">
            <div v-if="loading" class="rounded-2xl border border-dashed border-default px-4 py-10 text-center text-sm text-muted">
              正在加载商机列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #customerName-cell="{ row }">
                {{ row.original.customerName || '-' }}
              </template>

              <template #amount-cell="{ row }">
                {{ formatCurrency(row.original.amount) }}
              </template>

              <template #stage-cell="{ row }">
                <UBadge :color="crmOpportunityStageColor(row.original.stage)" variant="subtle">
                  {{ findOptionLabel(crmOpportunityStageOptions, row.original.stage) }}
                </UBadge>
              </template>

              <template #expectedCloseDate-cell="{ row }">
                {{ formatDate(row.original.expectedCloseDate) }}
              </template>

              <template #updatedAt-cell="{ row }">
                {{ formatDateTime(row.original.updatedAt) }}
              </template>

              <template #actions-cell="{ row }">
                <div class="flex justify-end">
                  <UDropdownMenu :items="rowActions(row.original)">
                    <UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis-vertical" />
                  </UDropdownMenu>
                </div>
              </template>
            </UTable>

            <div class="flex flex-col gap-3 border-t border-default pt-4 text-sm text-muted lg:flex-row lg:items-center lg:justify-between">
              <span>共 {{ total }} 条记录</span>
              <UPagination v-model:page="page" :items-per-page="limit" :total="total" />
            </div>
          </div>
        </UCard>

        <UModal v-model:open="open">
          <template #content>
            <UCard class="sm:max-w-3xl">
              <template #header>
                <div>
                  <p class="text-base font-semibold text-highlighted">
                    {{ modalTitle }}
                  </p>
                  <p class="text-sm text-muted">
                    商机记录会绑定客户，并用于跟踪销售过程和预计金额。
                  </p>
                </div>
              </template>

              <UForm :schema="opportunitySchema" :state="opportunityForm" class="space-y-4" @submit="submitOpportunity">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="customerId" label="客户" required>
                    <USelect
                      v-model="opportunityForm.customerId"
                      :items="customerItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="stage" label="阶段" required>
                    <USelect
                      v-model="opportunityForm.stage"
                      :items="crmOpportunityStageOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="title" label="商机标题" required class="lg:col-span-2">
                    <UInput v-model="opportunityForm.title" :disabled="isReadonly" placeholder="请输入商机标题" />
                  </UFormField>

                  <UFormField name="amount" label="预计金额" required>
                    <UInput v-model.number="opportunityForm.amount" :disabled="isReadonly" type="number" min="0" step="0.01" placeholder="请输入金额" />
                  </UFormField>

                  <UFormField name="expectedCloseDate" label="预计成交时间">
                    <UInput v-model="opportunityForm.expectedCloseDate" :disabled="isReadonly" type="date" />
                  </UFormField>

                  <UFormField name="description" label="商机描述" required class="lg:col-span-2">
                    <UTextarea
                      v-model="opportunityForm.description"
                      :rows="5"
                      :disabled="isReadonly"
                      placeholder="补充商机背景、推进节点和关键需求"
                    />
                  </UFormField>
                </div>

                <div class="flex justify-end gap-3">
                  <UButton color="neutral" variant="ghost" @click="open = false">
                    {{ isReadonly ? '关闭' : '取消' }}
                  </UButton>
                  <UButton v-if="!isReadonly" type="submit" color="primary" :loading="submitting">
                    保存
                  </UButton>
                </div>
              </UForm>
            </UCard>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
