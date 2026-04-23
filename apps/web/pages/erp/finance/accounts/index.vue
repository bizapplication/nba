<script setup lang="ts">
import { z } from 'zod'

import type { Account, AccountFormState, AccountStatus, AccountType, Ledger } from '~/types/finance'
import {
  FILTER_ALL_VALUE,
  accountStatusOptions,
  accountTypeOptions,
  asOptionalSelectValue,
  balanceTypeOptions,
  createOptionalSelectItem,
  deriveBalanceType,
  findOptionLabel,
  fromOptionalSelectValue,
  formatSignedBalance,
  formatDateTime,
  normalizeFilterValue,
  statusColor,
  toSelectItems
} from '~/utils/finance'

const api = useFinanceApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Account[]>([])
const accountOptions = ref<Account[]>([])
const ledgerOptions = ref<Ledger[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const showBalance = ref(true)
const errorMessage = ref('')

const search = ref('')
const typeFilter = ref<AccountType | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const statusFilter = ref<AccountStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const ledgerFilter = ref(FILTER_ALL_VALUE)

const typeItems = toSelectItems(accountTypeOptions)
const statusItems = toSelectItems(accountStatusOptions)

const accountSchema = z.object({
  name: z.string().min(1, '请输入账户名称'),
  code: z.string().min(1, '请输入科目代码'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  balanceType: z.enum(['DEBIT', 'CREDIT']),
  currency: z.string().min(1, '请输入币种'),
  parentId: z.string().optional(),
  ledgerId: z.string().min(1, '请选择所属总账'),
  status: z.enum(['ACTIVE', 'DISABLED', 'FROZEN']),
  description: z.string().optional()
})

const accountForm = reactive<AccountFormState>(createAccountForm())

const columns = [
  { accessorKey: 'name', header: '账户名称' },
  { accessorKey: 'code', header: '科目代码' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'balanceType', header: '余额方向' },
  { accessorKey: 'currency', header: '币种' },
  { accessorKey: 'parentName', header: '主账户' },
  { accessorKey: 'ledgerName', header: '所属总账' },
  { accessorKey: 'balance', header: '余额（借+/贷-）' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const modalTitle = computed(() => {
  if (formMode.value === 'view') {
    return '账户详情'
  }

  if (formMode.value === 'edit') {
    return '编辑账户'
  }

  return '新增账户'
})

const modalDescription = computed(() => {
  if (formMode.value === 'view') {
    return '只读查看账户属性、余额方向和父子层级关系。'
  }

  if (formMode.value === 'edit') {
    return '更新账户属性、父子关系与所属总账。'
  }

  return '新建一条账户记录，余额方向会随类型自动推导。'
})

function createAccountForm(): AccountFormState {
  return {
    name: '',
    code: '',
    type: 'ASSET',
    balanceType: 'DEBIT',
    currency: 'CNY',
    parentId: '',
    ledgerId: '',
    status: 'ACTIVE',
    description: ''
  }
}

const ledgerSelectItems = computed(() => [
  ...ledgerOptions.value.map((ledger) => ({
    label: `${ledger.name} / ${ledger.code}`,
    value: ledger.id
  }))
])

const filterLedgerItems = computed(() => [
  { label: '全部总账', value: FILTER_ALL_VALUE },
  ...ledgerOptions.value.map((ledger) => ({
    label: `${ledger.name} / ${ledger.code}`,
    value: ledger.id
  }))
])

const parentAccountItems = computed(() => [
  createOptionalSelectItem('不设置主账户'),
  ...accountOptions.value
    .filter((account) => account.id !== editingId.value)
    .map((account) => ({
      label: `${account.name} / ${account.code}`,
      value: account.id
    }))
])

const accountLedgerLocked = computed(() => Boolean(accountForm.parentId))

const parentIdValue = computed({
  get: () => asOptionalSelectValue(accountForm.parentId),
  set: (value: string) => {
    accountForm.parentId = fromOptionalSelectValue(value)
  }
})

function assignForm(account: Account) {
  Object.assign(accountForm, {
    name: account.name,
    code: account.code,
    type: account.type,
    balanceType: account.balanceType,
    currency: account.currency,
    parentId: account.parentId || '',
    ledgerId: account.ledgerId,
    status: account.status,
    description: account.description || ''
  })
}

async function loadReferences() {
  const [ledgers, accounts] = await Promise.all([
    api.listLedgers({ page: 1, limit: 100 }),
    api.listAccounts({ page: 1, limit: 200 })
  ])

  ledgerOptions.value = ledgers.data
  accountOptions.value = accounts.data
}

async function loadAccounts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listAccounts({
      page: page.value,
      limit,
      search: search.value || undefined,
      type: normalizeFilterValue(typeFilter.value),
      status: normalizeFilterValue(statusFilter.value),
      ledgerId: normalizeFilterValue(ledgerFilter.value)
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
  Object.assign(accountForm, createAccountForm())
  const firstLedger = ledgerOptions.value[0]
  if (firstLedger) {
    accountForm.ledgerId = firstLedger.id
  }
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(account: Account) {
  formMode.value = 'edit'
  editingId.value = account.id
  assignForm(account)
  open.value = true
}

function openViewModal(account: Account) {
  formMode.value = 'view'
  editingId.value = account.id
  assignForm(account)
  open.value = true
}

async function submitAccount() {
  submitting.value = true
  accountForm.balanceType = deriveBalanceType(accountForm.type)

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateAccount(editingId.value, accountForm)
      toast.add({
        title: '账户已更新',
        color: 'success'
      })
    } else {
      await api.createAccount(accountForm)
      toast.add({
        title: '账户已创建',
        color: 'success'
      })
      page.value = 1
    }

    open.value = false
    await Promise.all([loadReferences(), loadAccounts()])
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

async function removeAccount(account: Account) {
  const confirmed = window.confirm(`确认删除账户“${account.name}”吗？`)
  if (!confirmed) {
    return
  }

  try {
    await api.deleteAccount(account.id)
    toast.add({
      title: '账户已删除',
      color: 'success'
    })

    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }

    await Promise.all([loadReferences(), loadAccounts()])
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(account: Account): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(account)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(account)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeAccount(account)
      }
    }
  ]]
}

watch(
  () => accountForm.type,
  (value) => {
    accountForm.balanceType = deriveBalanceType(value)
  },
  { immediate: true }
)

watch(
  () => accountForm.parentId,
  (parentId) => {
    if (!parentId) {
      return
    }

    const parent = accountOptions.value.find((item) => item.id === parentId)
    if (parent) {
      accountForm.ledgerId = parent.ledgerId
    }
  }
)

watch(page, () => {
  void loadAccounts()
})

watch([typeFilter, statusFilter, ledgerFilter], () => {
  page.value = 1
  void loadAccounts()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadAccounts()
  }, 250)
})

onMounted(async () => {
  await loadReferences()
  resetForm()
  await loadAccounts()
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
              账户管理
            </p>
            <p class="text-sm text-muted">
              管理会计科目、父子账户关系与方向化余额展示
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增账户
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
          placeholder="搜索账户名称、代码或描述"
        />

        <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
          <USelect v-model="typeFilter" :items="typeItems" value-key="value" label-key="label" placeholder="类型" class="min-w-36" />
          <USelect v-model="statusFilter" :items="statusItems" value-key="value" label-key="label" placeholder="状态" class="min-w-36" />
          <USelect v-model="ledgerFilter" :items="filterLedgerItems" value-key="value" label-key="label" placeholder="所属总账" class="min-w-48" />
          <UButton
            color="neutral"
            variant="subtle"
            :icon="showBalance ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            @click="showBalance = !showBalance"
          >
            {{ showBalance ? '隐藏余额' : '显示余额' }}
          </UButton>
          <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadAccounts">
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

      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-scale"
        description="余额列按会计方向化余额展示：借方余额为正，贷方余额为负；“余额方向”列显示该科目的正常余额方向。"
      />

      <UCard>
        <div class="space-y-4">
          <div v-if="loading" class="rounded-2xl border border-dashed border-default px-4 py-10 text-center text-sm text-muted">
            正在加载账户列表...
          </div>

          <UTable v-else :data="rows" :columns="columns">
            <template #type-cell="{ row }">
              {{ findOptionLabel(accountTypeOptions, row.original.type) }}
            </template>

            <template #balanceType-cell="{ row }">
              {{ findOptionLabel(balanceTypeOptions, row.original.balanceType) }}
            </template>

            <template #parentName-cell="{ row }">
              {{ row.original.parentName || '-' }}
            </template>

            <template #ledgerName-cell="{ row }">
              {{ row.original.ledgerName || '-' }}
            </template>

            <template #balance-cell="{ row }">
              <span class="font-medium tabular-nums text-highlighted">
                {{ showBalance ? formatSignedBalance(row.original.balance, row.original.balanceType, row.original.currency) : '******' }}
              </span>
            </template>

            <template #status-cell="{ row }">
              <UBadge :color="statusColor(row.original.status)" variant="subtle">
                {{ findOptionLabel(accountStatusOptions, row.original.status) }}
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
            <UCard class="w-full sm:max-w-4xl">
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

          <UForm :schema="accountSchema" :state="accountForm" class="space-y-4" @submit="submitAccount">
            <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <UFormField name="name" label="账户名称" required>
                <UInput v-model="accountForm.name" :disabled="isReadonly" placeholder="请输入账户名称" />
              </UFormField>

              <UFormField name="code" label="科目代码" required>
                <UInput v-model="accountForm.code" :disabled="isReadonly" placeholder="如 1001" />
              </UFormField>

              <UFormField name="type" label="类型" required>
                <USelect
                  v-model="accountForm.type"
                  :items="accountTypeOptions"
                  value-key="value"
                  label-key="label"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="balanceType" label="余额方向" required>
                <UInput :model-value="findOptionLabel(balanceTypeOptions, accountForm.balanceType)" disabled />
              </UFormField>

              <UFormField name="currency" label="币种" required>
                <UInput v-model="accountForm.currency" :disabled="isReadonly" placeholder="如 CNY" />
              </UFormField>

              <UFormField name="status" label="状态" required>
                <USelect
                  v-model="accountForm.status"
                  :items="accountStatusOptions"
                  value-key="value"
                  label-key="label"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="parentId" label="主账户">
                <USelect
                  v-model="parentIdValue"
                  :items="parentAccountItems"
                  value-key="value"
                  label-key="label"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="ledgerId" label="所属总账" required>
                <USelect
                  v-model="accountForm.ledgerId"
                  :items="ledgerSelectItems"
                  value-key="value"
                  label-key="label"
                  placeholder="请选择总账"
                  :disabled="isReadonly || accountLedgerLocked"
                />
              </UFormField>

              <UFormField name="description" label="描述" class="lg:col-span-2 xl:col-span-3">
                <UTextarea
                  v-model="accountForm.description"
                  :rows="4"
                  :disabled="isReadonly"
                  placeholder="补充账户用途说明"
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
