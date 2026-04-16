<script setup lang="ts">
import { z } from 'zod'

import type { Account, TransactionStatus } from '~/types/finance'
import type {
  Customer,
  CustomerBankAccount,
  Receipt,
  ReceiptFormState,
  ReceiptStatus
} from '~/types/crm'
import { useFinanceApi } from '~/composables/useFinanceApi'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  normalizeFilterValue,
  statusColor,
  toSelectItems,
  transactionStatusOptions
} from '~/utils/finance'
import { crmStatusColor, receiptStatusOptions } from '~/utils/crm'

const api = useCrmApi()
const financeApi = useFinanceApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Receipt[]>([])
const customerOptions = ref<Customer[]>([])
const customerBankAccountOptions = ref<CustomerBankAccount[]>([])
const financeAccountOptions = ref<Account[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<ReceiptStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const customerFilter = ref(FILTER_ALL_VALUE)
const receiptToAccountFilter = ref(FILTER_ALL_VALUE)
const dateFrom = ref('')
const dateTo = ref('')

const statusItems = toSelectItems(receiptStatusOptions)

const receiptSchema = z.object({
  receiptOrderNo: z.string().optional(),
  customerId: z.string().min(1, '请选择客户'),
  customerBankAccountId: z.string().min(1, '请选择客户付款账户'),
  receiptToAccountId: z.string().min(1, '请选择收款账户'),
  revenueAccountId: z.string().min(1, '请选择收入账户'),
  amount: z.number().positive('请输入大于 0 的金额'),
  currency: z.string().min(3, '请输入币种'),
  purpose: z.string().min(1, '请输入收款用途'),
  receiptDate: z.string().min(1, '请选择收款日期'),
  referenceNo: z.string().optional(),
  description: z.string().optional()
})

const receiptForm = reactive<ReceiptFormState>(createReceiptForm())

const columns = [
  { accessorKey: 'receiptOrderNo', header: '收款单号' },
  { accessorKey: 'customerName', header: '客户' },
  { accessorKey: 'receiptToAccountName', header: '收款账户' },
  { accessorKey: 'amount', header: '金额' },
  { accessorKey: 'receiptDate', header: '收款日期' },
  { accessorKey: 'status', header: '业务状态' },
  { accessorKey: 'transactionStatus', header: '财务状态' },
  { accessorKey: 'transactionCode', header: '财务交易' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const customerFilterItems = computed(() => [
  { label: '全部客户', value: FILTER_ALL_VALUE },
  ...customerOptions.value.map((customer) => ({
    label: `${customer.customerName} / ${customer.customerCode}`,
    value: customer.id
  }))
])

const receiptToAccountFilterItems = computed(() => [
  { label: '全部收款账户', value: FILTER_ALL_VALUE },
  ...financeAccountOptions.value.map((account) => ({
    label: `${account.name} / ${account.code}`,
    value: account.id
  }))
])

const customerFormItems = computed(() => customerOptions.value.map((customer) => ({
  label: `${customer.customerName} / ${customer.customerCode}`,
  value: customer.id
})))

const currentCustomerBankAccountItems = computed(() => {
  return customerBankAccountOptions.value
    .filter((bankAccount) => bankAccount.customerId === receiptForm.customerId && bankAccount.status === 'active')
    .map((bankAccount) => ({
      label: `${bankAccount.bankName} / ${bankAccount.accountNo}${bankAccount.isDefault ? ' / 默认' : ''}`,
      value: bankAccount.id
    }))
})

const financeAccountItems = computed(() => financeAccountOptions.value.map((account) => ({
  label: `${account.name} / ${account.code}`,
  value: account.id
})))

const financeRevenueAccountItems = computed(() => {
  const candidates = financeAccountOptions.value.filter((account) => account.id !== receiptForm.receiptToAccountId)
  const incomeAccounts = candidates.filter((account) => account.type === 'INCOME')
  const source = incomeAccounts.length ? incomeAccounts : candidates

  return source.map((account) => ({
    label: `${account.name} / ${account.code}`,
    value: account.id
  }))
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

function createReceiptForm(): ReceiptFormState {
  return {
    receiptOrderNo: '',
    customerId: '',
    customerBankAccountId: '',
    receiptToAccountId: '',
    revenueAccountId: '',
    amount: undefined,
    currency: 'CNY',
    purpose: '',
    receiptDate: new Date().toISOString().slice(0, 10),
    referenceNo: '',
    description: ''
  }
}

function assignForm(receipt: Receipt) {
  Object.assign(receiptForm, {
    receiptOrderNo: receipt.receiptOrderNo,
    customerId: receipt.customerId,
    customerBankAccountId: receipt.customerBankAccountId,
    receiptToAccountId: receipt.receiptToAccountId,
    revenueAccountId: receipt.revenueAccountId,
    amount: receipt.amount,
    currency: receipt.currency,
    purpose: receipt.purpose,
    receiptDate: receipt.receiptDate,
    referenceNo: receipt.referenceNo || '',
    description: receipt.description || ''
  })
}

function syncCustomerBankAccountSelection() {
  const matches = customerBankAccountOptions.value.filter((bankAccount) => bankAccount.customerId === receiptForm.customerId && bankAccount.status === 'active')
  if (!matches.length) {
    receiptForm.customerBankAccountId = ''
    return
  }

  const exists = matches.some((bankAccount) => bankAccount.id === receiptForm.customerBankAccountId)
  if (exists) {
    return
  }

  receiptForm.customerBankAccountId = matches.find((bankAccount) => bankAccount.isDefault)?.id || matches[0]?.id || ""
}

function syncRevenueAccountSelection() {
  if (receiptForm.revenueAccountId && receiptForm.revenueAccountId !== receiptForm.receiptToAccountId) {
    const exists = financeRevenueAccountItems.value.some((account) => account.value === receiptForm.revenueAccountId)
    if (exists) {
      return
    }
  }

  receiptForm.revenueAccountId = financeRevenueAccountItems.value[0]?.value || ''
}

async function loadReferences() {
  const [customers, customerBankAccounts, accounts] = await Promise.all([
    api.listCustomers({ page: 1, limit: 100 }),
    api.listCustomerBankAccounts({ page: 1, limit: 200 }),
    financeApi.listAccounts({ page: 1, limit: 200 })
  ])

  customerOptions.value = customers.data
  customerBankAccountOptions.value = customerBankAccounts.data
  financeAccountOptions.value = accounts.data.filter((account) => account.status === 'ACTIVE')
}

async function loadReceipts(options: { notifyInvalid?: boolean } = {}) {
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
    const result = await api.listReceipts({
      page: page.value,
      limit,
      search: search.value || undefined,
      status: normalizeFilterValue(statusFilter.value),
      customerId: normalizeFilterValue(customerFilter.value),
      receiptToAccountId: normalizeFilterValue(receiptToAccountFilter.value),
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
  void loadReceipts()
}

function resetForm() {
  Object.assign(receiptForm, createReceiptForm())

  const firstCustomer = customerOptions.value[0]
  if (firstCustomer) {
    receiptForm.customerId = firstCustomer.id
  }

  syncCustomerBankAccountSelection()

  const firstReceiptTo = financeAccountOptions.value[0]
  if (firstReceiptTo) {
    receiptForm.receiptToAccountId = firstReceiptTo.id
  }

  syncRevenueAccountSelection()
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(receipt: Receipt) {
  formMode.value = 'edit'
  editingId.value = receipt.id
  assignForm(receipt)
  syncCustomerBankAccountSelection()
  syncRevenueAccountSelection()
  open.value = true
}

function openViewModal(receipt: Receipt) {
  formMode.value = 'view'
  editingId.value = receipt.id
  assignForm(receipt)
  syncCustomerBankAccountSelection()
  syncRevenueAccountSelection()
  open.value = true
}

async function submitReceipt() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateReceipt(editingId.value, receiptForm)
      toast.add({ title: '收款单已更新', color: 'success' })
    } else {
      await api.createReceipt(receiptForm)
      toast.add({ title: '收款单已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadReceipts()
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

async function removeReceipt(receipt: Receipt) {
  if (!window.confirm(`确认删除收款单“${receipt.receiptOrderNo}”吗？`)) {
    return
  }

  try {
    await api.deleteReceipt(receipt.id)
    toast.add({ title: '收款单已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadReceipts()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

async function executeReceipt(receipt: Receipt) {
  if (!window.confirm(`确认执行收款单“${receipt.receiptOrderNo}”吗？执行后会生成财务交易。`)) {
    return
  }

  try {
    const result = await api.executeReceipt(receipt.id)
    toast.add({
      title: '收款单已执行',
      description: result.transactionCode
        ? `已生成财务交易 ${result.transactionCode}`
        : '收款结果已进入财务交易视图。',
      color: 'success'
    })
    await loadReceipts()
  } catch (error) {
    toast.add({
      title: '执行失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(receipt: Receipt): any {
  const actions: any[] = [
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(receipt)
      }
    }
  ]

  if (receipt.status === 'DRAFT') {
    actions.push(
      {
        label: '编辑',
        icon: 'i-lucide-pencil',
        onSelect: () => {
          openEditModal(receipt)
        }
      },
      {
        label: '执行收款',
        icon: 'i-lucide-circle-play',
        onSelect: () => {
          void executeReceipt(receipt)
        }
      },
      {
        label: '删除',
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: () => {
          void removeReceipt(receipt)
        }
      }
    )
  }

  return [actions]
}

watch(page, () => {
  void loadReceipts()
})

watch([statusFilter, customerFilter, receiptToAccountFilter], () => {
  page.value = 1
  void loadReceipts()
})

watch([dateFrom, dateTo], () => {
  page.value = 1
  void loadReceipts()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadReceipts()
  }, 250)
})

watch(
  () => receiptForm.customerId,
  () => {
    syncCustomerBankAccountSelection()
  }
)

watch(
  () => receiptForm.receiptToAccountId,
  () => {
    syncRevenueAccountSelection()
  }
)

onMounted(async () => {
  await loadReferences()
  await loadReceipts()
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
              收款单
            </p>
            <p class="text-sm text-muted">
              创建收款单并在执行后回流到现有 finance 交易结果层
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增收款单
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索收款单号、客户、用途或参考号" />

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
              v-model="receiptToAccountFilter"
              :items="receiptToAccountFilterItems"
              value-key="value"
              label-key="label"
              placeholder="收款账户"
              class="min-w-56"
            />
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
              class="min-w-36"
            />
            <UInput v-model="dateFrom" type="date" class="min-w-40" />
            <UInput v-model="dateTo" type="date" class="min-w-40" />
            <UButton color="neutral" variant="subtle" icon="i-lucide-eraser" @click="clearDateRange">
              清空日期
            </UButton>
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadReceipts({ notifyInvalid: true })">
              刷新
            </UButton>
          </div>
        </div>

        <UAlert
          v-if="dateRangeError"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
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
              正在加载收款单列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #amount-cell="{ row }">
                {{ formatCurrency(row.original.amount, row.original.currency) }}
              </template>

              <template #receiptDate-cell="{ row }">
                {{ formatDate(row.original.receiptDate) }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="crmStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(receiptStatusOptions, row.original.status) }}
                </UBadge>
              </template>

              <template #transactionStatus-cell="{ row }">
                <UBadge
                  v-if="row.original.transactionStatus"
                  :color="statusColor(row.original.transactionStatus as TransactionStatus)"
                  variant="subtle"
                >
                  {{ findOptionLabel(transactionStatusOptions, row.original.transactionStatus as TransactionStatus) }}
                </UBadge>
                <span v-else class="text-sm text-muted">-</span>
              </template>

              <template #transactionCode-cell="{ row }">
                {{ row.original.transactionCode || '-' }}
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
                    {{
                      formMode === 'view'
                        ? '收款单详情'
                        : formMode === 'edit'
                          ? '编辑收款单'
                          : '新增收款单'
                    }}
                  </p>
                  <p class="text-sm text-muted">
                    收款单先作为业务单据存在，执行后会生成 finance 交易并自动过账。
                  </p>
                </div>
              </template>

              <UForm :schema="receiptSchema" :state="receiptForm" class="space-y-4" @submit="submitReceipt">
                <div class="grid gap-4 md:grid-cols-2">
                  <UFormField label="收款单号" name="receiptOrderNo">
                    <UInput v-model="receiptForm.receiptOrderNo" :disabled="isReadonly" placeholder="留空则自动生成" />
                  </UFormField>
                  <UFormField label="客户" name="customerId">
                    <USelect
                      v-model="receiptForm.customerId"
                      :items="customerFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                      placeholder="请选择客户"
                    />
                  </UFormField>
                  <UFormField label="客户付款账户" name="customerBankAccountId">
                    <USelect
                      v-model="receiptForm.customerBankAccountId"
                      :items="currentCustomerBankAccountItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly || !receiptForm.customerId"
                      placeholder="请选择客户付款账户"
                    />
                  </UFormField>
                  <UFormField label="收款账户" name="receiptToAccountId">
                    <USelect
                      v-model="receiptForm.receiptToAccountId"
                      :items="financeAccountItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                      placeholder="请选择收款账户"
                    />
                  </UFormField>
                  <UFormField label="收入账户" name="revenueAccountId">
                    <USelect
                      v-model="receiptForm.revenueAccountId"
                      :items="financeRevenueAccountItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                      placeholder="请选择收入账户"
                    />
                  </UFormField>
                  <UFormField label="币种" name="currency">
                    <UInput v-model="receiptForm.currency" :disabled="isReadonly" placeholder="如 CNY" />
                  </UFormField>
                  <UFormField label="金额" name="amount">
                    <UInput v-model.number="receiptForm.amount" :disabled="isReadonly" type="number" min="0" step="0.01" placeholder="请输入金额" />
                  </UFormField>
                  <UFormField label="收款日期" name="receiptDate">
                    <UInput v-model="receiptForm.receiptDate" :disabled="isReadonly" type="date" />
                  </UFormField>
                  <UFormField label="参考号" name="referenceNo">
                    <UInput v-model="receiptForm.referenceNo" :disabled="isReadonly" placeholder="可选，外部单号或付款参考" />
                  </UFormField>
                </div>

                <UFormField label="收款用途" name="purpose">
                  <UInput v-model="receiptForm.purpose" :disabled="isReadonly" placeholder="请输入收款用途" />
                </UFormField>

                <UFormField label="描述" name="description">
                  <UTextarea v-model="receiptForm.description" :disabled="isReadonly" :rows="4" placeholder="可选，补充收款说明" />
                </UFormField>

                <div v-if="!isReadonly" class="flex justify-end gap-3">
                  <UButton color="neutral" variant="ghost" @click="open = false">
                    取消
                  </UButton>
                  <UButton type="submit" color="primary" :loading="submitting">
                    {{ formMode === 'edit' ? '保存更新' : '创建收款单' }}
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
