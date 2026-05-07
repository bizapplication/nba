<script setup lang="ts">
import { z } from 'zod'

import type { Bank, BankFormState, FinancialStatus, LifecycleStatus } from '~/types/finance'
import {
  FILTER_ALL_VALUE,
  financialStatusOptions,
  findOptionLabel,
  formatDateTime,
  lifecycleStatusOptions,
  normalizeFilterValue,
  statusColor,
  toSelectItems
} from '~/utils/finance'

const api = useFinanceApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Bank[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<LifecycleStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const financialStatusFilter = ref<FinancialStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)

const statusItems = toSelectItems(lifecycleStatusOptions)
const financialStatusItems = toSelectItems(financialStatusOptions)

const bankSchema = z.object({
  name: z.string().min(1, '请输入银行名称'),
  bankCode: z.string().min(1, '请输入银行代码'),
  shortName: z.string().min(1, '请输入银行简称'),
  description: z.string().optional(),
  financialStatus: z.enum(['ENABLED', 'DISABLED', 'FROZEN']),
  status: z.enum(['active', 'inactive'])
})

const bankForm = reactive<BankFormState>(createBankForm())

const columns = [
  { accessorKey: 'name', header: '银行名称' },
  { accessorKey: 'bankCode', header: '银行代码' },
  { accessorKey: 'shortName', header: '简称' },
  { accessorKey: 'financialStatus', header: '财务状态' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'updatedAt', header: '更新时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const modalTitle = computed(() => {
  if (formMode.value === 'view') {
    return '银行详情'
  }

  if (formMode.value === 'edit') {
    return '编辑银行'
  }

  return '新增银行'
})

const modalDescription = computed(() => {
  if (formMode.value === 'view') {
    return '只读查看银行基础信息与当前状态。'
  }

  if (formMode.value === 'edit') {
    return '更新银行基础信息、财务状态与生命周期状态。'
  }

  return '新建一条银行基础信息记录。'
})

function createBankForm(): BankFormState {
  return {
    name: '',
    bankCode: '',
    shortName: '',
    description: '',
    financialStatus: 'ENABLED',
    status: 'active'
  }
}

function assignForm(bank: Bank) {
  Object.assign(bankForm, {
    name: bank.name,
    bankCode: bank.bankCode,
    shortName: bank.shortName,
    description: bank.description || '',
    financialStatus: bank.financialStatus,
    status: bank.status
  })
}

async function loadBanks() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listBanks({
      page: page.value,
      limit,
      search: search.value || undefined,
      status: normalizeFilterValue(statusFilter.value),
      financialStatus: normalizeFilterValue(financialStatusFilter.value)
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
  Object.assign(bankForm, createBankForm())
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(bank: Bank) {
  formMode.value = 'edit'
  editingId.value = bank.id
  assignForm(bank)
  open.value = true
}

function openViewModal(bank: Bank) {
  formMode.value = 'view'
  editingId.value = bank.id
  assignForm(bank)
  open.value = true
}

async function submitBank() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateBank(editingId.value, bankForm)
      toast.add({
        title: '银行已更新',
        description: '银行信息已经同步到当前列表。',
        color: 'success'
      })
    } else {
      await api.createBank(bankForm)
      toast.add({
        title: '银行已创建',
        description: '银行记录已经保存到当前财务列表。',
        color: 'success'
      })
      page.value = 1
    }

    open.value = false
    await loadBanks()
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

async function removeBank(bank: Bank) {
  const confirmed = window.confirm(`确认删除银行“${bank.name}”吗？`)
  if (!confirmed) {
    return
  }

  try {
    await api.deleteBank(bank.id)
    toast.add({
      title: '银行已删除',
      color: 'success'
    })

    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }

    await loadBanks()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(bank: Bank): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(bank)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(bank)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeBank(bank)
      }
    }
  ]]
}

watch(page, () => {
  void loadBanks()
})

watch([statusFilter, financialStatusFilter], () => {
  page.value = 1
  void loadBanks()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadBanks()
  }, 250)
})

onMounted(() => {
  void loadBanks()
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
              银行管理
            </p>
            <p class="text-sm text-muted">
              维护银行主体、财务状态与启停状态
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增银行
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            size="lg"
            placeholder="搜索银行名称、代码或简称"
          />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="financialStatusFilter"
              :items="financialStatusItems"
              value-key="value"
              label-key="label"
              placeholder="财务状态"
              class="min-w-40"
            />
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
              class="min-w-36"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadBanks">
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
              正在加载银行列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #financialStatus-cell="{ row }">
                <UBadge :color="statusColor(row.original.financialStatus)" variant="subtle">
                  {{ findOptionLabel(financialStatusOptions, row.original.financialStatus) }}
                </UBadge>
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="statusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(lifecycleStatusOptions, row.original.status) }}
                </UBadge>
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
            <UCard class="sm:max-w-2xl">
              <template #header>
                <div>
                  <p class="text-base font-semibold text-highlighted">
                    {{ modalTitle }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ modalDescription }}
                  </p>
                </div>
              </template>

              <UForm :schema="bankSchema" :state="bankForm" class="space-y-4" @submit="submitBank">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="name" label="银行名称" required>
                    <UInput v-model="bankForm.name" :disabled="isReadonly" placeholder="请输入银行名称" />
                  </UFormField>

                  <UFormField name="bankCode" label="银行代码" required>
                    <UInput v-model="bankForm.bankCode" :disabled="isReadonly" placeholder="如 ICBC" />
                  </UFormField>

                  <UFormField name="shortName" label="银行简称" required>
                    <UInput v-model="bankForm.shortName" :disabled="isReadonly" placeholder="请输入简称" />
                  </UFormField>

                  <UFormField name="financialStatus" label="财务状态" required>
                    <USelect
                      v-model="bankForm.financialStatus"
                      :items="financialStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="bankForm.status"
                      :items="lifecycleStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="description" label="描述" class="lg:col-span-2">
                    <UTextarea
                      v-model="bankForm.description"
                      :rows="4"
                      :disabled="isReadonly"
                      placeholder="补充银行说明"
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
