<script setup lang="ts">
import { z } from 'zod'

import type {
  Account,
  Ledger,
  Transaction,
  TransactionFormState,
  TransactionStatus,
  TransactionType
} from '~/types/finance'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  normalizeFilterValue,
  statusColor,
  todayDate,
  toSelectItems,
  transactionStatusOptions,
  transactionTypeOptions
} from '~/utils/finance'

const api = useFinanceApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Transaction[]>([])
const accountOptions = ref<Account[]>([])
const ledgerOptions = ref<Ledger[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const typeFilter = ref<TransactionType | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const statusFilter = ref<TransactionStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const ledgerFilter = ref(FILTER_ALL_VALUE)
const dateFrom = ref('')
const dateTo = ref('')

const typeItems = toSelectItems(transactionTypeOptions)
const statusItems = toSelectItems(transactionStatusOptions)

const transactionSchema = z.object({
  code: z.string().optional(),
  ledgerId: z.string().min(1, '请选择所属总账'),
  transactionDate: z.string().min(1, '请选择交易日期'),
  type: z.enum(['PAYMENT', 'RECEIPT', 'TRANSFER', 'MANUAL_JOURNAL']),
  amount: z.number().positive('请输入大于 0 的金额'),
  debitAccountId: z.string().min(1, '请选择借方账户'),
  creditAccountId: z.string().min(1, '请选择贷方账户'),
  description: z.string().optional(),
  referenceNo: z.string().optional(),
  currency: z.string().min(1, '请输入币种')
})

const transactionForm = reactive<TransactionFormState>(createTransactionForm())

const columns = [
  { accessorKey: 'code', header: '交易编号' },
  { accessorKey: 'type', header: '类型' },
  { accessorKey: 'amount', header: '金额' },
  { accessorKey: 'debitAccountName', header: '借方账户' },
  { accessorKey: 'creditAccountName', header: '贷方账户' },
  { accessorKey: 'ledgerName', header: '所属总账' },
  { accessorKey: 'transactionDate', header: '交易日期' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const modalTitle = computed(() => {
  if (formMode.value === 'view') {
    return '交易详情'
  }

  if (formMode.value === 'edit') {
    return '编辑交易'
  }

  return '新增交易'
})

const modalDescription = computed(() => {
  if (formMode.value === 'view') {
    return '只读查看交易信息、借贷账户与当前状态。'
  }

  if (formMode.value === 'edit') {
    return '仅待过账交易允许编辑，过账后将锁定编辑与删除。'
  }

  return '创建一条新的交易记录，后续可继续过账或取消过账。'
})

const dateRangeError = computed(() => {
  if (!dateFrom.value || !dateTo.value) {
    return ''
  }

  if (dateFrom.value > dateTo.value) {
    return '开始日期不能晚于结束日期，请先修正日期范围。'
  }

  return ''
})

const hasDateRange = computed(() => Boolean(dateFrom.value || dateTo.value))

function createTransactionForm(): TransactionFormState {
  return {
    code: '',
    ledgerId: '',
    transactionDate: todayDate(),
    type: 'PAYMENT',
    amount: undefined,
    debitAccountId: '',
    creditAccountId: '',
    description: '',
    referenceNo: '',
    currency: 'CNY'
  }
}

const ledgerSelectItems = computed(() => [
  { label: '全部总账', value: FILTER_ALL_VALUE },
  ...ledgerOptions.value.map((ledger) => ({
    label: `${ledger.name} / ${ledger.code}`,
    value: ledger.id
  }))
])

const formLedgerItems = computed(() => [
  ...ledgerOptions.value.map((ledger) => ({
    label: `${ledger.name} / ${ledger.code}`,
    value: ledger.id
  }))
])

const transactionLedgerAccounts = computed(() => {
  const filtered = accountOptions.value.filter((account) => {
    if (!transactionForm.ledgerId) {
      return true
    }

    return account.ledgerId === transactionForm.ledgerId
  })

  return filtered.map((account) => ({
    label: `${account.name} / ${account.code}`,
    value: account.id
  }))
})

function assignForm(transaction: Transaction) {
  Object.assign(transactionForm, {
    code: transaction.code,
    ledgerId: transaction.ledgerId,
    transactionDate: transaction.transactionDate,
    type: transaction.type,
    amount: transaction.amount,
    debitAccountId: transaction.debitAccountId,
    creditAccountId: transaction.creditAccountId,
    description: transaction.description || '',
    referenceNo: transaction.referenceNo || '',
    currency: transaction.currency || 'CNY'
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

async function loadTransactions(options: { notifyInvalid?: boolean } = {}) {
  if (dateRangeError.value) {
    if (options.notifyInvalid) {
      toast.add({
        title: '日期范围无效',
        description: dateRangeError.value,
        color: 'warning'
      })
    }
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listTransactions({
      page: page.value,
      limit,
      search: search.value || undefined,
      type: normalizeFilterValue(typeFilter.value),
      status: normalizeFilterValue(statusFilter.value),
      ledgerId: normalizeFilterValue(ledgerFilter.value),
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined
    })

    rows.value = result.data
    total.value = result.total
  } catch (error) {
    errorMessage.value = api.toErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function clearDateRange() {
  dateFrom.value = ''
  dateTo.value = ''
  page.value = 1
  void loadTransactions()
}

function resetForm() {
  Object.assign(transactionForm, createTransactionForm())
  const firstLedger = ledgerOptions.value[0]
  if (firstLedger) {
    transactionForm.ledgerId = firstLedger.id
  }
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(transaction: Transaction) {
  formMode.value = 'edit'
  editingId.value = transaction.id
  assignForm(transaction)
  open.value = true
}

function openViewModal(transaction: Transaction) {
  formMode.value = 'view'
  editingId.value = transaction.id
  assignForm(transaction)
  open.value = true
}

async function submitTransaction() {
  submitting.value = true

  try {
    const payload: TransactionFormState = {
      ...transactionForm,
      amount: Number(transactionForm.amount || 0)
    }

    if (formMode.value === 'edit' && editingId.value) {
      await api.updateTransaction(editingId.value, payload)
      toast.add({
        title: '交易已更新',
        color: 'success'
      })
    } else {
      await api.createTransaction(payload)
      toast.add({
        title: '交易已创建',
        color: 'success'
      })
      page.value = 1
    }

    open.value = false
    await loadTransactions()
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

async function removeTransaction(transaction: Transaction) {
  const confirmed = window.confirm(`确认删除交易“${transaction.code}”吗？`)
  if (!confirmed) {
    return
  }

  try {
    await api.deleteTransaction(transaction.id)
    toast.add({
      title: '交易已删除',
      color: 'success'
    })

    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }

    await loadTransactions()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

async function postTransaction(transaction: Transaction) {
  try {
    await api.postTransaction(transaction.id)
    toast.add({
      title: '交易已过账',
      color: 'success'
    })
    await loadTransactions()
  } catch (error) {
    toast.add({
      title: '过账失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

async function unpostTransaction(transaction: Transaction) {
  try {
    await api.unpostTransaction(transaction.id)
    toast.add({
      title: '交易已取消过账',
      color: 'success'
    })
    await loadTransactions()
  } catch (error) {
    toast.add({
      title: '取消过账失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(transaction: Transaction): any {
  const pending = transaction.status === 'PENDING'
  const posted = transaction.status === 'POSTED'

  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(transaction)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      disabled: !pending,
      onSelect: () => {
        openEditModal(transaction)
      }
    },
    {
      label: '过账',
      icon: 'i-lucide-badge-check',
      disabled: !pending,
      onSelect: () => {
        void postTransaction(transaction)
      }
    },
    {
      label: '取消过账',
      icon: 'i-lucide-rotate-ccw',
      disabled: !posted,
      onSelect: () => {
        void unpostTransaction(transaction)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      disabled: !pending,
      onSelect: () => {
        void removeTransaction(transaction)
      }
    }
  ]]
}

watch(
  () => transactionForm.ledgerId,
  (ledgerId) => {
    if (!ledgerId) {
      return
    }

    const allowedAccountIds = new Set(
      accountOptions.value
        .filter((account) => account.ledgerId === ledgerId)
        .map((account) => account.id)
    )

    if (transactionForm.debitAccountId && !allowedAccountIds.has(transactionForm.debitAccountId)) {
      transactionForm.debitAccountId = ''
    }

    if (transactionForm.creditAccountId && !allowedAccountIds.has(transactionForm.creditAccountId)) {
      transactionForm.creditAccountId = ''
    }
  }
)

watch(page, () => {
  if (dateRangeError.value) {
    return
  }

  void loadTransactions()
})

watch([typeFilter, statusFilter, ledgerFilter, dateFrom, dateTo], () => {
  page.value = 1

  if (dateRangeError.value) {
    return
  }

  void loadTransactions()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1

    if (dateRangeError.value) {
      return
    }

    void loadTransactions()
  }, 250)
})

onMounted(async () => {
  await loadReferences()
  resetForm()
  await loadTransactions()
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
              交易管理
            </p>
            <p class="text-sm text-muted">
              发起交易、编辑待过账记录并完成过账 / 取消过账
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增交易
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
          placeholder="搜索交易编号、描述或参考号"
        />

        <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
          <USelect v-model="typeFilter" :items="typeItems" value-key="value" label-key="label" placeholder="类型" class="min-w-40" />
          <USelect v-model="statusFilter" :items="statusItems" value-key="value" label-key="label" placeholder="状态" class="min-w-40" />
          <USelect v-model="ledgerFilter" :items="ledgerSelectItems" value-key="value" label-key="label" placeholder="所属总账" class="min-w-48" />
          <UInput v-model="dateFrom" type="date" class="min-w-40" />
          <UInput v-model="dateTo" type="date" class="min-w-40" />
          <UButton
            v-if="hasDateRange"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            @click="clearDateRange"
          >
            清空日期
          </UButton>
          <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadTransactions({ notifyInvalid: true })">
            刷新
          </UButton>
        </div>
      </div>

      <UAlert
        v-if="dateRangeError"
        color="warning"
        variant="subtle"
        icon="i-lucide-calendar-range"
        :description="dateRangeError"
      />

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
            正在加载交易列表...
          </div>

          <UTable v-else :data="rows" :columns="columns">
            <template #type-cell="{ row }">
              {{ findOptionLabel(transactionTypeOptions, row.original.type) }}
            </template>

            <template #amount-cell="{ row }">
              <span class="font-medium text-highlighted">
                {{ formatCurrency(row.original.amount, row.original.currency) }}
              </span>
            </template>

            <template #debitAccountName-cell="{ row }">
              {{ row.original.debitAccountName || '-' }}
            </template>

            <template #creditAccountName-cell="{ row }">
              {{ row.original.creditAccountName || '-' }}
            </template>

            <template #ledgerName-cell="{ row }">
              {{ row.original.ledgerName || '-' }}
            </template>

            <template #transactionDate-cell="{ row }">
              {{ formatDate(row.original.transactionDate) }}
            </template>

            <template #status-cell="{ row }">
              <UBadge :color="statusColor(row.original.status)" variant="subtle">
                {{ findOptionLabel(transactionStatusOptions, row.original.status) }}
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
            <UCard class="w-full sm:max-w-5xl">
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

          <UForm
            :schema="transactionSchema"
            :state="transactionForm"
            class="space-y-4"
            @submit="submitTransaction"
          >
            <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <UFormField name="code" label="交易编号">
                <UInput
                  v-model="transactionForm.code"
                  :disabled="isReadonly"
                  placeholder="留空时自动生成"
                />
              </UFormField>

              <UFormField name="ledgerId" label="所属总账" required>
                <USelect
                  v-model="transactionForm.ledgerId"
                  :items="formLedgerItems"
                  value-key="value"
                  label-key="label"
                  placeholder="请选择总账"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="transactionDate" label="交易日期" required>
                <UInput
                  v-model="transactionForm.transactionDate"
                  type="date"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="type" label="类型" required>
                <USelect
                  v-model="transactionForm.type"
                  :items="transactionTypeOptions"
                  value-key="value"
                  label-key="label"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="amount" label="金额" required>
                <UInput
                  :model-value="transactionForm.amount === undefined ? '' : String(transactionForm.amount)"
                  type="number"
                  min="0"
                  step="0.01"
                  :disabled="isReadonly"
                  placeholder="请输入金额"
                  @update:model-value="transactionForm.amount = $event === '' || $event === undefined ? undefined : Number($event)"
                />
              </UFormField>

              <UFormField name="currency" label="币种" required>
                <UInput v-model="transactionForm.currency" :disabled="isReadonly" placeholder="如 CNY" />
              </UFormField>

              <UFormField name="debitAccountId" label="借方账户" required class="xl:col-span-2">
                <USelect
                  v-model="transactionForm.debitAccountId"
                  :items="transactionLedgerAccounts"
                  value-key="value"
                  label-key="label"
                  placeholder="请选择账户"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="creditAccountId" label="贷方账户" required class="xl:col-span-2">
                <USelect
                  v-model="transactionForm.creditAccountId"
                  :items="transactionLedgerAccounts"
                  value-key="value"
                  label-key="label"
                  placeholder="请选择账户"
                  :disabled="isReadonly"
                />
              </UFormField>

              <UFormField name="referenceNo" label="参考号">
                <UInput v-model="transactionForm.referenceNo" :disabled="isReadonly" placeholder="请输入参考号" />
              </UFormField>

              <UFormField name="description" label="描述" class="lg:col-span-2 xl:col-span-3">
                <UTextarea
                  v-model="transactionForm.description"
                  :disabled="isReadonly"
                  :rows="4"
                  placeholder="补充交易说明"
                />
              </UFormField>
            </div>

            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="open = false">
                {{ isReadonly ? '关闭' : '取消' }}
              </UButton>
              <UButton
                v-if="!isReadonly"
                type="submit"
                color="primary"
                :loading="submitting"
              >
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
