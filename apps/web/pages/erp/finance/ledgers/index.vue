<script setup lang="ts">
import { z } from 'zod'

import type { Bank, Ledger, LedgerFormState, LedgerType, LifecycleStatus } from '~/types/finance'
import {
  FILTER_ALL_VALUE,
  asOptionalSelectValue,
  createOptionalSelectItem,
  findOptionLabel,
  fromOptionalSelectValue,
  formatDateTime,
  ledgerTypeOptions,
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
const rows = ref<Ledger[]>([])
const ledgerOptions = ref<Ledger[]>([])
const bankOptions = ref<Bank[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const typeFilter = ref<LedgerType | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const statusFilter = ref<LifecycleStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const bankFilter = ref(FILTER_ALL_VALUE)

const typeItems = toSelectItems(ledgerTypeOptions)
const statusItems = toSelectItems(lifecycleStatusOptions)

const ledgerSchema = z.object({
  name: z.string().min(1, '请输入总账名称'),
  code: z.string().min(1, '请输入总账代码'),
  description: z.string().optional(),
  type: z.enum(['ANNUAL', 'MONTHLY', 'DEPARTMENT', 'BUSINESS']),
  bankId: z.string().optional(),
  parentId: z.string().optional(),
  baseCurrency: z.string().min(1, '请输入基础货币'),
  status: z.enum(['active', 'inactive'])
})

const ledgerForm = reactive<LedgerFormState>(createLedgerForm())

const columns = [
  { accessorKey: 'name', header: '总账名称' },
  { accessorKey: 'code', header: '总账代码' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'bankName', header: '关联银行' },
  { accessorKey: 'parentName', header: '主账' },
  { accessorKey: 'baseCurrency', header: '基础货币' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const modalTitle = computed(() => {
  if (formMode.value === 'view') {
    return '总账详情'
  }

  if (formMode.value === 'edit') {
    return '编辑总账'
  }

  return '新增总账'
})

const modalDescription = computed(() => {
  if (formMode.value === 'view') {
    return '只读查看总账属性、层级关系与银行绑定。'
  }

  if (formMode.value === 'edit') {
    return '更新总账基本属性、层级关系与银行绑定。'
  }

  return '新建一条总账记录。'
})

function createLedgerForm(): LedgerFormState {
  return {
    name: '',
    code: '',
    description: '',
    type: 'ANNUAL',
    bankId: '',
    parentId: '',
    baseCurrency: 'CNY',
    status: 'active'
  }
}

const filterBankItems = computed(() => [
  { label: '全部银行', value: FILTER_ALL_VALUE },
  ...bankOptions.value.map((bank) => ({
    label: `${bank.shortName} / ${bank.bankCode}`,
    value: bank.id
  }))
])

const bankSelectItems = computed(() => [
  createOptionalSelectItem('不设置银行'),
  ...bankOptions.value.map((bank) => ({
    label: `${bank.shortName} / ${bank.bankCode}`,
    value: bank.id
  }))
])

const parentLedgerItems = computed(() => [
  createOptionalSelectItem('不设置主账'),
  ...ledgerOptions.value
    .filter((ledger) => ledger.id !== editingId.value)
    .map((ledger) => ({
      label: `${ledger.name} / ${ledger.code}`,
      value: ledger.id
    }))
])

const bankIdValue = computed({
  get: () => asOptionalSelectValue(ledgerForm.bankId),
  set: (value: string) => {
    ledgerForm.bankId = fromOptionalSelectValue(value)
  }
})

const parentIdValue = computed({
  get: () => asOptionalSelectValue(ledgerForm.parentId),
  set: (value: string) => {
    ledgerForm.parentId = fromOptionalSelectValue(value)
  }
})

function assignForm(ledger: Ledger) {
  Object.assign(ledgerForm, {
    name: ledger.name,
    code: ledger.code,
    description: ledger.description || '',
    type: ledger.type,
    bankId: ledger.bankId || '',
    parentId: ledger.parentId || '',
    baseCurrency: ledger.baseCurrency,
    status: ledger.status
  })
}

async function loadReferences() {
  const [banks, ledgers] = await Promise.all([
    api.listBanks({ page: 1, limit: 100 }),
    api.listLedgers({ page: 1, limit: 100 })
  ])

  bankOptions.value = banks.data
  ledgerOptions.value = ledgers.data
}

async function loadLedgers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listLedgers({
      page: page.value,
      limit,
      search: search.value || undefined,
      type: normalizeFilterValue(typeFilter.value),
      status: normalizeFilterValue(statusFilter.value),
      bankId: normalizeFilterValue(bankFilter.value)
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
  Object.assign(ledgerForm, createLedgerForm())
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(ledger: Ledger) {
  formMode.value = 'edit'
  editingId.value = ledger.id
  assignForm(ledger)
  open.value = true
}

function openViewModal(ledger: Ledger) {
  formMode.value = 'view'
  editingId.value = ledger.id
  assignForm(ledger)
  open.value = true
}

async function submitLedger() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateLedger(editingId.value, ledgerForm)
      toast.add({
        title: '总账已更新',
        color: 'success'
      })
    } else {
      await api.createLedger(ledgerForm)
      toast.add({
        title: '总账已创建',
        color: 'success'
      })
      page.value = 1
    }

    open.value = false
    await Promise.all([loadReferences(), loadLedgers()])
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

async function removeLedger(ledger: Ledger) {
  const confirmed = window.confirm(`确认删除总账“${ledger.name}”吗？`)
  if (!confirmed) {
    return
  }

  try {
    await api.deleteLedger(ledger.id)
    toast.add({
      title: '总账已删除',
      color: 'success'
    })

    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }

    await Promise.all([loadReferences(), loadLedgers()])
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(ledger: Ledger): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(ledger)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(ledger)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeLedger(ledger)
      }
    }
  ]]
}

watch(page, () => {
  void loadLedgers()
})

watch([typeFilter, statusFilter, bankFilter], () => {
  page.value = 1
  void loadLedgers()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadLedgers()
  }, 250)
})

onMounted(async () => {
  await loadReferences()
  await loadLedgers()
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
              总账管理
            </p>
            <p class="text-sm text-muted">
              管理总账层级、银行绑定、币种与启停状态
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增总账
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
          placeholder="搜索总账名称、代码或描述"
        />

        <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
          <USelect v-model="typeFilter" :items="typeItems" value-key="value" label-key="label" placeholder="类型" class="min-w-40" />
          <USelect v-model="statusFilter" :items="statusItems" value-key="value" label-key="label" placeholder="状态" class="min-w-36" />
          <USelect v-model="bankFilter" :items="filterBankItems" value-key="value" label-key="label" placeholder="关联银行" class="min-w-44" />
          <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadLedgers">
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
            正在加载总账列表...
          </div>

          <UTable v-else :data="rows" :columns="columns">
            <template #type-cell="{ row }">
              {{ findOptionLabel(ledgerTypeOptions, row.original.type) }}
            </template>

            <template #bankName-cell="{ row }">
              {{ row.original.bankName || '-' }}
            </template>

            <template #parentName-cell="{ row }">
              {{ row.original.parentName || '-' }}
            </template>

            <template #status-cell="{ row }">
              <UBadge :color="statusColor(row.original.status)" variant="subtle">
                {{ findOptionLabel(lifecycleStatusOptions, row.original.status) }}
              </UBadge>
            </template>

            <template #createTime-cell="{ row }">
              {{ formatDateTime(row.original.createTime) }}
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
                {{ modalDescription }}
              </p>
            </div>
          </template>

          <UForm :schema="ledgerSchema" :state="ledgerForm" class="space-y-4" @submit="submitLedger">
            <div class="grid gap-4 lg:grid-cols-2">
              <UFormField name="name" label="总账名称" required>
                <UInput v-model="ledgerForm.name" :disabled="isReadonly" placeholder="请输入总账名称" />
              </UFormField>

              <UFormField name="code" label="总账代码" required>
                <UInput v-model="ledgerForm.code" :disabled="isReadonly" placeholder="如 GL-CN-MAIN" />
              </UFormField>

              <UFormField name="type" label="类型" required>
                <USelect
                  v-model="ledgerForm.type"
                  :items="ledgerTypeOptions"
                  value-key="value"
                  label-key="label"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="bankId" label="关联银行">
                <USelect
                  v-model="bankIdValue"
                  :items="bankSelectItems"
                  value-key="value"
                  label-key="label"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="parentId" label="主账">
                <USelect
                  v-model="parentIdValue"
                  :items="parentLedgerItems"
                  value-key="value"
                  label-key="label"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="baseCurrency" label="基础货币" required>
                <UInput v-model="ledgerForm.baseCurrency" :disabled="isReadonly" placeholder="如 CNY" />
              </UFormField>

              <UFormField name="status" label="状态" required>
                <USelect
                  v-model="ledgerForm.status"
                  :items="lifecycleStatusOptions"
                  value-key="value"
                  label-key="label"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="description" label="描述" class="lg:col-span-2">
                <UTextarea
                  v-model="ledgerForm.description"
                  :rows="4"
                  :disabled="isReadonly"
                  placeholder="补充总账说明"
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
