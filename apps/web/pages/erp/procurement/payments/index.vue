<script setup lang="ts">
import { z } from 'zod'

import type { Account, SelectOption, TransactionStatus } from '~/types/finance'
import type {
  Payment,
  PaymentFormState,
  PaymentStatus,
  Vendor,
  VendorBankAccount
} from '~/types/procurement'
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
import { paymentStatusOptions, procurementStatusColor } from '~/utils/procurement'

const api = useProcurementApi()
const financeApi = useFinanceApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Payment[]>([])
const vendorOptions = ref<Vendor[]>([])
const vendorBankAccountOptions = ref<VendorBankAccount[]>([])
const financeAccountOptions = ref<Account[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<PaymentStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const vendorFilter = ref(FILTER_ALL_VALUE)
const payFromAccountFilter = ref(FILTER_ALL_VALUE)
const dateFrom = ref('')
const dateTo = ref('')

const statusItems = toSelectItems(paymentStatusOptions)

const paymentSchema = z.object({
  paymentOrderNo: z.string().optional(),
  vendorId: z.string().min(1, '请选择供应商'),
  vendorBankAccountId: z.string().min(1, '请选择供应商收款账户'),
  payFromAccountId: z.string().min(1, '请选择付款账户'),
  expenseAccountId: z.string().min(1, '请选择费用账户'),
  amount: z.number().positive('请输入大于 0 的金额'),
  currency: z.string().min(3, '请输入币种'),
  purpose: z.string().min(1, '请输入付款用途'),
  paymentDate: z.string().min(1, '请选择付款日期'),
  referenceNo: z.string().optional(),
  description: z.string().optional()
})

const paymentForm = reactive<PaymentFormState>(createPaymentForm())

const columns = [
  { accessorKey: 'paymentOrderNo', header: '付款单号' },
  { accessorKey: 'vendorName', header: '供应商' },
  { accessorKey: 'payFromAccountName', header: '付款账户' },
  { accessorKey: 'amount', header: '金额' },
  { accessorKey: 'paymentDate', header: '付款日期' },
  { accessorKey: 'status', header: '业务状态' },
  { accessorKey: 'transactionStatus', header: '财务状态' },
  { accessorKey: 'transactionCode', header: '财务交易' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const vendorFilterItems = computed(() => [
  { label: '全部供应商', value: FILTER_ALL_VALUE },
  ...vendorOptions.value.map((vendor) => ({
    label: `${vendor.vendorName} / ${vendor.vendorCode}`,
    value: vendor.id
  }))
])

const payFromAccountFilterItems = computed(() => [
  { label: '全部付款账户', value: FILTER_ALL_VALUE },
  ...financeAccountOptions.value.map((account) => ({
    label: `${account.name} / ${account.code}`,
    value: account.id
  }))
])

const vendorFormItems = computed(() => vendorOptions.value.map((vendor) => ({
  label: `${vendor.vendorName} / ${vendor.vendorCode}`,
  value: vendor.id
})))

const currentVendorBankAccountItems = computed(() => {
  return vendorBankAccountOptions.value
    .filter((bankAccount) => bankAccount.vendorId === paymentForm.vendorId && bankAccount.status === 'active')
    .map((bankAccount) => ({
      label: `${bankAccount.bankName} / ${bankAccount.accountNo}${bankAccount.isDefault ? ' / 默认' : ''}`,
      value: bankAccount.id
    }))
})

const financeSourceAccounts = computed(() => financeAccountOptions.value
  .filter((account) => account.type === 'ASSET'))

const financeExpenseAccounts = computed(() => financeAccountOptions.value
  .filter((account) => account.type === 'EXPENSE'))

const financeSourceAccountItems = computed(() => financeSourceAccounts.value.map((account) => ({
  label: `${account.name} / ${account.code}`,
  value: account.id
})))

const financeExpenseAccountItems = computed(() => financeExpenseAccounts.value
  .filter((account) => account.id !== paymentForm.payFromAccountId)
  .map((account) => ({
    label: `${account.name} / ${account.code}`,
    value: account.id
  })))

const dateRangeError = computed(() => {
  if (!dateFrom.value || !dateTo.value) {
    return ''
  }

  if (dateFrom.value > dateTo.value) {
    return '开始日期不能晚于结束日期，请先修正日期范围。'
  }

  return ''
})

function createPaymentForm(): PaymentFormState {
  return {
    paymentOrderNo: '',
    vendorId: '',
    vendorBankAccountId: '',
    payFromAccountId: '',
    expenseAccountId: '',
    amount: undefined,
    currency: 'CNY',
    purpose: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceNo: '',
    description: ''
  }
}

function assignForm(payment: Payment) {
  Object.assign(paymentForm, {
    paymentOrderNo: payment.paymentOrderNo,
    vendorId: payment.vendorId,
    vendorBankAccountId: payment.vendorBankAccountId,
    payFromAccountId: payment.payFromAccountId,
    expenseAccountId: payment.expenseAccountId,
    amount: payment.amount,
    currency: payment.currency,
    purpose: payment.purpose,
    paymentDate: payment.paymentDate,
    referenceNo: payment.referenceNo || '',
    description: payment.description || ''
  })
}

function syncVendorBankAccountSelection() {
  const matches = vendorBankAccountOptions.value.filter((bankAccount) => bankAccount.vendorId === paymentForm.vendorId && bankAccount.status === 'active')
  if (!matches.length) {
    paymentForm.vendorBankAccountId = ''
    return
  }

  const exists = matches.some((bankAccount) => bankAccount.id === paymentForm.vendorBankAccountId)
  if (exists) {
    return
  }

  paymentForm.vendorBankAccountId = matches.find((bankAccount) => bankAccount.isDefault)?.id || matches[0]?.id || ""
}

function syncAccountSelections() {
  if (!financeSourceAccounts.value.length) {
    paymentForm.payFromAccountId = ''
    paymentForm.expenseAccountId = ''
    return
  }

  const payFromExists = financeSourceAccounts.value.some((account) => account.id === paymentForm.payFromAccountId)
  if (!payFromExists) {
    paymentForm.payFromAccountId = financeSourceAccounts.value[0]?.id || ''
  }

  const expenseCandidates = financeExpenseAccounts.value.filter((account) => account.id !== paymentForm.payFromAccountId)
  if (!expenseCandidates.length) {
    paymentForm.expenseAccountId = ''
    return
  }

  const expenseExists = expenseCandidates.some((account) => account.id === paymentForm.expenseAccountId)
  if (!expenseExists) {
    paymentForm.expenseAccountId = expenseCandidates[0]?.id || ''
  }
}

async function loadReferences() {
  const [vendors, vendorBankAccounts, accounts] = await Promise.all([
    api.listVendors({ page: 1, limit: 100 }),
    api.listVendorBankAccounts({ page: 1, limit: 200 }),
    financeApi.listAccounts({ page: 1, limit: 200 })
  ])

  vendorOptions.value = vendors.data
  vendorBankAccountOptions.value = vendorBankAccounts.data
  financeAccountOptions.value = accounts.data.filter((account) => account.status === 'ACTIVE')
  syncAccountSelections()
}

async function loadPayments(options: { notifyInvalid?: boolean } = {}) {
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
    const result = await api.listPayments({
      page: page.value,
      limit,
      search: search.value || undefined,
      status: normalizeFilterValue(statusFilter.value),
      vendorId: normalizeFilterValue(vendorFilter.value),
      payFromAccountId: normalizeFilterValue(payFromAccountFilter.value),
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
  void loadPayments()
}

function resetForm() {
  Object.assign(paymentForm, createPaymentForm())

  const firstVendor = vendorOptions.value[0]
  if (firstVendor) {
    paymentForm.vendorId = firstVendor.id
  }

  syncVendorBankAccountSelection()
  syncAccountSelections()
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(payment: Payment) {
  formMode.value = 'edit'
  editingId.value = payment.id
  assignForm(payment)
  syncVendorBankAccountSelection()
  syncAccountSelections()
  open.value = true
}

function openViewModal(payment: Payment) {
  formMode.value = 'view'
  editingId.value = payment.id
  assignForm(payment)
  syncVendorBankAccountSelection()
  syncAccountSelections()
  open.value = true
}

async function submitPayment() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updatePayment(editingId.value, paymentForm)
      toast.add({ title: '付款单已更新', color: 'success' })
    } else {
      await api.createPayment(paymentForm)
      toast.add({ title: '付款单已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadPayments()
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

async function removePayment(payment: Payment) {
  if (!window.confirm(`确认删除付款单“${payment.paymentOrderNo}”吗？`)) {
    return
  }

  try {
    await api.deletePayment(payment.id)
    toast.add({ title: '付款单已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadPayments()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

async function executePayment(payment: Payment) {
  if (!window.confirm(`确认执行付款单“${payment.paymentOrderNo}”吗？执行后会生成财务交易。`)) {
    return
  }

  try {
    const result = await api.executePayment(payment.id)
    toast.add({
      title: '付款单已执行',
      description: result.transactionCode
        ? `已生成财务交易 ${result.transactionCode}`
        : '付款结果已进入财务交易视图。',
      color: 'success'
    })
    await loadPayments()
  } catch (error) {
    toast.add({
      title: '执行失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(payment: Payment): any {
  const draftActions = payment.status === 'DRAFT'
    ? [
        {
          label: '编辑',
          icon: 'i-lucide-pencil',
          onSelect: () => {
            openEditModal(payment)
          }
        },
        {
          label: '执行付款',
          icon: 'i-lucide-play',
          onSelect: () => {
            void executePayment(payment)
          }
        },
        {
          label: '删除',
          icon: 'i-lucide-trash-2',
          color: 'error',
          onSelect: () => {
            void removePayment(payment)
          }
        }
      ]
    : []

  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(payment)
      }
    },
    ...draftActions
  ]]
}

watch(page, () => {
  void loadPayments()
})

watch([statusFilter, vendorFilter, payFromAccountFilter], () => {
  page.value = 1
  void loadPayments()
})

watch([dateFrom, dateTo], () => {
  page.value = 1
  void loadPayments()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadPayments()
  }, 250)
})

watch(() => paymentForm.vendorId, () => {
  syncVendorBankAccountSelection()
})

watch(() => paymentForm.payFromAccountId, () => {
  syncAccountSelections()
})

onMounted(async () => {
  await loadReferences()
  await loadPayments()
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
              付款单
            </p>
            <p class="text-sm text-muted">
              先维护业务单据，执行后写入现有 finance 交易结果层
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增付款单
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索付款单号、供应商、用途或参考号" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="vendorFilter"
              :items="vendorFilterItems"
              value-key="value"
              label-key="label"
              placeholder="供应商"
              class="min-w-56"
            />
            <USelect
              v-model="payFromAccountFilter"
              :items="payFromAccountFilterItems"
              value-key="value"
              label-key="label"
              placeholder="付款账户"
              class="min-w-56"
            />
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="业务状态"
              class="min-w-40"
            />
            <UInput v-model="dateFrom" type="date" class="min-w-40" />
            <UInput v-model="dateTo" type="date" class="min-w-40" />
            <UButton
              v-if="dateFrom || dateTo"
              color="neutral"
              variant="ghost"
              icon="i-lucide-eraser"
              @click="clearDateRange"
            >
              清空日期
            </UButton>
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadPayments({ notifyInvalid: true })">
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
              正在加载付款单列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #amount-cell="{ row }">
                {{ formatCurrency(row.original.amount, row.original.currency) }}
              </template>

              <template #paymentDate-cell="{ row }">
                {{ formatDate(row.original.paymentDate) }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="procurementStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(paymentStatusOptions, row.original.status) }}
                </UBadge>
              </template>

              <template #transactionStatus-cell="{ row }">
                <UBadge
                  :color="row.original.transactionStatus ? statusColor(row.original.transactionStatus) : 'neutral'"
                  variant="subtle"
                >
                  {{
                    row.original.transactionStatus
                      ? findOptionLabel(transactionStatusOptions as SelectOption<TransactionStatus>[], row.original.transactionStatus)
                      : '-'
                  }}
                </UBadge>
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

        <USlideover
          v-model:open="open"
          side="right"
          :title="formMode === 'view' ? '付款单详情' : formMode === 'edit' ? '编辑付款单' : '新增付款单'"
          description="付款单执行后会自动生成一笔 finance 交易，并继续复用现有过账结果视图。"
          :ui="{
            content: 'max-w-[min(96vw,72rem)]',
            body: 'flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6',
            footer: 'border-t border-default p-4 sm:px-6'
          }"
        >
          <template #body>
            <UForm id="payment-form" :schema="paymentSchema" :state="paymentForm" class="space-y-4" @submit="submitPayment">
              <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <UFormField name="paymentOrderNo" label="付款单号">
                  <UInput v-model="paymentForm.paymentOrderNo" :disabled="isReadonly" placeholder="为空则自动生成" />
                </UFormField>

                <UFormField name="currency" label="币种" required>
                  <UInput v-model="paymentForm.currency" :disabled="isReadonly" placeholder="如 CNY" />
                </UFormField>

                <UFormField name="vendorId" label="供应商" required class="xl:col-span-2">
                  <USelect
                    v-model="paymentForm.vendorId"
                    :items="vendorFormItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="vendorBankAccountId" label="供应商收款账户" required class="xl:col-span-2">
                  <USelect
                    v-model="paymentForm.vendorBankAccountId"
                    :items="currentVendorBankAccountItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="payFromAccountId" label="付款账户" required class="xl:col-span-2">
                  <USelect
                    v-model="paymentForm.payFromAccountId"
                    :items="financeSourceAccountItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="expenseAccountId" label="费用账户" required class="xl:col-span-2">
                  <USelect
                    v-model="paymentForm.expenseAccountId"
                    :items="financeExpenseAccountItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="amount" label="金额" required>
                  <UInput v-model.number="paymentForm.amount" :disabled="isReadonly" type="number" min="0" step="0.01" placeholder="请输入付款金额" />
                </UFormField>

                <UFormField name="paymentDate" label="付款日期" required>
                  <UInput v-model="paymentForm.paymentDate" :disabled="isReadonly" type="date" />
                </UFormField>

                <UFormField name="purpose" label="付款用途" required class="lg:col-span-2 xl:col-span-3">
                  <UInput v-model="paymentForm.purpose" :disabled="isReadonly" placeholder="如 March office service fee" />
                </UFormField>

                <UFormField name="referenceNo" label="参考号">
                  <UInput v-model="paymentForm.referenceNo" :disabled="isReadonly" placeholder="可选外部参考号" />
                </UFormField>

                <UFormField name="description" label="描述" class="lg:col-span-2 xl:col-span-3">
                  <UTextarea
                    v-model="paymentForm.description"
                    :disabled="isReadonly"
                    :rows="4"
                    placeholder="补充付款说明或内部备注"
                  />
                </UFormField>
              </div>
            </UForm>
          </template>

          <template #footer>
            <div class="flex w-full justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="open = false">
                {{ isReadonly ? '关闭' : '取消' }}
              </UButton>
              <UButton v-if="!isReadonly" type="submit" form="payment-form" color="primary" :loading="submitting">
                保存
              </UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </template>
  </UDashboardPanel>
</template>
