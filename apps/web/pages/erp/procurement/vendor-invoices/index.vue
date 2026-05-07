<script setup lang="ts">
import { z } from 'zod'

import type { Account, SelectOption, TransactionStatus } from '~/types/finance'
import type {
  GoodsReceipt,
  PurchaseOrder,
  Vendor,
  VendorInvoice,
  VendorInvoiceFormState,
  VendorInvoiceStatus
} from '~/types/procurement'
import { useFinanceApi } from '~/composables/useFinanceApi'
import {
  FILTER_ALL_VALUE,
  asOptionalSelectValue,
  createOptionalSelectItem,
  findOptionLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  fromOptionalSelectValue,
  normalizeFilterValue,
  statusColor,
  toSelectItems,
  transactionStatusOptions
} from '~/utils/finance'
import { paymentStatusOptions, procurementStatusColor, vendorInvoiceStatusOptions } from '~/utils/procurement'

const api = useProcurementApi()
const financeApi = useFinanceApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<VendorInvoice[]>([])
const vendorOptions = ref<Vendor[]>([])
const purchaseOrderOptions = ref<PurchaseOrder[]>([])
const goodsReceiptOptions = ref<GoodsReceipt[]>([])
const financeAccountOptions = ref<Account[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<VendorInvoiceStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const vendorFilter = ref(FILTER_ALL_VALUE)
const purchaseOrderFilter = ref(FILTER_ALL_VALUE)
const dateFrom = ref('')
const dateTo = ref('')

const statusItems = toSelectItems(vendorInvoiceStatusOptions)
const editableStatusItems = vendorInvoiceStatusOptions.filter((option) => option.value !== 'EXECUTED')

const vendorInvoiceSchema = z.object({
  vendorInvoiceNo: z.string().optional(),
  vendorId: z.string().min(1, '请选择供应商'),
  purchaseOrderId: z.string().min(1, '请选择采购订单'),
  goodsReceiptId: z.string().optional(),
  payFromAccountId: z.string().min(1, '请选择付款账户'),
  expenseAccountId: z.string().min(1, '请选择费用账户'),
  amount: z.number().positive('请输入大于 0 的发票金额'),
  currency: z.string().min(3, '请输入币种'),
  invoiceDate: z.string().min(1, '请选择发票日期'),
  status: z.string().min(1, '请选择状态'),
  referenceNo: z.string().optional(),
  description: z.string().optional()
})

const vendorInvoiceForm = reactive<VendorInvoiceFormState>(createVendorInvoiceForm())

const columns = [
  { accessorKey: 'vendorInvoiceNo', header: '发票单号' },
  { accessorKey: 'vendorName', header: '供应商' },
  { accessorKey: 'purchaseOrderNo', header: '采购订单' },
  { accessorKey: 'goodsReceiptNo', header: '收货记录' },
  { accessorKey: 'amount', header: '金额' },
  { accessorKey: 'invoiceDate', header: '发票日期' },
  { accessorKey: 'status', header: '业务状态' },
  { accessorKey: 'paymentStatus', header: '付款结果' },
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

const purchaseOrderFilterItems = computed(() => [
  { label: '全部采购订单', value: FILTER_ALL_VALUE },
  ...purchaseOrderOptions.value.map((purchaseOrder) => ({
    label: `${purchaseOrder.purchaseOrderNo} / ${purchaseOrder.vendorName || '-'}`,
    value: purchaseOrder.id
  }))
])

const vendorFormItems = computed(() => vendorOptions.value.map((vendor) => ({
  label: `${vendor.vendorName} / ${vendor.vendorCode}`,
  value: vendor.id
})))

const currentPurchaseOrderItems = computed(() => {
  const source = vendorInvoiceForm.vendorId
    ? purchaseOrderOptions.value.filter((purchaseOrder) => purchaseOrder.vendorId === vendorInvoiceForm.vendorId)
    : purchaseOrderOptions.value

  return source.map((purchaseOrder) => ({
    label: `${purchaseOrder.purchaseOrderNo} / ${purchaseOrder.productName || '-'} / ${purchaseOrder.vendorName || '-'}`,
    value: purchaseOrder.id
  }))
})

const currentGoodsReceiptItems = computed(() => {
  const source = vendorInvoiceForm.purchaseOrderId
    ? goodsReceiptOptions.value.filter((goodsReceipt) => goodsReceipt.purchaseOrderId === vendorInvoiceForm.purchaseOrderId)
    : goodsReceiptOptions.value

  return [
    createOptionalSelectItem('不关联收货记录'),
    ...source.map((goodsReceipt) => ({
      label: `${goodsReceipt.goodsReceiptNo} / ${goodsReceipt.quantity}`,
      value: goodsReceipt.id
    }))
  ]
})

const filteredFinanceAccounts = computed(() => {
  const activeAccounts = financeAccountOptions.value.filter((account) => account.status === 'ACTIVE')

  if (!vendorInvoiceForm.currency) {
    return activeAccounts
  }

  const sameCurrency = activeAccounts.filter((account) => account.currency === vendorInvoiceForm.currency)
  return sameCurrency.length ? sameCurrency : activeAccounts
})

const payFromFinanceAccounts = computed(() => filteredFinanceAccounts.value
  .filter((account) => account.type === 'ASSET'))

const payFromAccountItems = computed(() => payFromFinanceAccounts.value.map((account) => ({
  label: `${account.name} / ${account.code}`,
  value: account.id
})))

const expenseFinanceAccounts = computed(() => filteredFinanceAccounts.value
  .filter((account) => account.type === 'EXPENSE'))

const expenseAccountItems = computed(() => expenseFinanceAccounts.value
  .filter((account) => account.id !== vendorInvoiceForm.payFromAccountId)
  .map((account) => ({
    label: `${account.name} / ${account.code}`,
    value: account.id
  })))

const selectedPurchaseOrder = computed(() => {
  return purchaseOrderOptions.value.find((item) => item.id === vendorInvoiceForm.purchaseOrderId) || null
})

const selectedGoodsReceipt = computed(() => {
  return goodsReceiptOptions.value.find((item) => item.id === vendorInvoiceForm.goodsReceiptId) || null
})

const goodsReceiptSelectValue = computed({
  get: () => asOptionalSelectValue(vendorInvoiceForm.goodsReceiptId),
  set: (value: string) => {
    vendorInvoiceForm.goodsReceiptId = fromOptionalSelectValue(value)
  }
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

function createVendorInvoiceForm(): VendorInvoiceFormState {
  return {
    vendorInvoiceNo: '',
    vendorId: '',
    purchaseOrderId: '',
    goodsReceiptId: '',
    payFromAccountId: '',
    expenseAccountId: '',
    amount: undefined,
    currency: 'CNY',
    invoiceDate: new Date().toISOString().slice(0, 10),
    status: 'DRAFT',
    referenceNo: '',
    description: ''
  }
}

function assignForm(invoice: VendorInvoice) {
  Object.assign(vendorInvoiceForm, {
    vendorInvoiceNo: invoice.vendorInvoiceNo,
    vendorId: invoice.vendorId,
    purchaseOrderId: invoice.purchaseOrderId,
    goodsReceiptId: invoice.goodsReceiptId || '',
    payFromAccountId: invoice.payFromAccountId,
    expenseAccountId: invoice.expenseAccountId,
    amount: invoice.amount,
    currency: invoice.currency,
    invoiceDate: invoice.invoiceDate,
    status: invoice.status,
    referenceNo: invoice.referenceNo || '',
    description: invoice.description || ''
  })
}

function syncPurchaseOrderSelection() {
  const matches = vendorInvoiceForm.vendorId
    ? purchaseOrderOptions.value.filter((purchaseOrder) => purchaseOrder.vendorId === vendorInvoiceForm.vendorId)
    : purchaseOrderOptions.value

  if (!matches.length) {
    vendorInvoiceForm.purchaseOrderId = ''
    return
  }

  const exists = matches.some((purchaseOrder) => purchaseOrder.id === vendorInvoiceForm.purchaseOrderId)
  if (exists) {
    return
  }

  vendorInvoiceForm.purchaseOrderId = matches[0]?.id || ""
}

function syncGoodsReceiptSelection() {
  const matches = vendorInvoiceForm.purchaseOrderId
    ? goodsReceiptOptions.value.filter((goodsReceipt) => goodsReceipt.purchaseOrderId === vendorInvoiceForm.purchaseOrderId)
    : goodsReceiptOptions.value

  if (!matches.length) {
    vendorInvoiceForm.goodsReceiptId = ''
    return
  }

  const exists = matches.some((goodsReceipt) => goodsReceipt.id === vendorInvoiceForm.goodsReceiptId)
  if (exists) {
    return
  }

  vendorInvoiceForm.goodsReceiptId = matches[0]?.id || ""
}

function syncInvoiceDraftFields() {
  if (!selectedPurchaseOrder.value) {
    return
  }

  vendorInvoiceForm.currency = selectedPurchaseOrder.value.currency

  if (formMode.value === 'create' || !vendorInvoiceForm.amount) {
    vendorInvoiceForm.amount = selectedPurchaseOrder.value.amount
  }
}

function syncFinanceAccounts() {
  const payFromMatches = payFromFinanceAccounts.value
  if (!payFromMatches.length) {
    vendorInvoiceForm.payFromAccountId = ''
    vendorInvoiceForm.expenseAccountId = ''
    return
  }

  const payFromExists = payFromMatches.some((account) => account.id === vendorInvoiceForm.payFromAccountId)
  if (!payFromExists) {
    vendorInvoiceForm.payFromAccountId = payFromMatches[0]?.id || ""
  }

  const expenseMatches = expenseFinanceAccounts.value
    .filter((account) => account.id !== vendorInvoiceForm.payFromAccountId)
  if (!expenseMatches.length) {
    vendorInvoiceForm.expenseAccountId = ''
    return
  }

  const expenseExists = expenseMatches.some((account) => account.id === vendorInvoiceForm.expenseAccountId)
  if (!expenseExists) {
    vendorInvoiceForm.expenseAccountId = expenseMatches[0]?.id || ""
  }
}

async function loadReferences() {
  const [vendors, purchaseOrders, goodsReceipts, accounts] = await Promise.all([
    api.listVendors({ page: 1, limit: 200 }),
    api.listPurchaseOrders({ page: 1, limit: 200 }),
    api.listGoodsReceipts({ page: 1, limit: 200 }),
    financeApi.listAccounts({ page: 1, limit: 200 })
  ])

  vendorOptions.value = vendors.data
  purchaseOrderOptions.value = purchaseOrders.data
  goodsReceiptOptions.value = goodsReceipts.data
  financeAccountOptions.value = accounts.data
}

async function loadVendorInvoices(options: { notifyInvalid?: boolean } = {}) {
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
    const result = await api.listVendorInvoices({
      page: page.value,
      limit,
      search: search.value || undefined,
      vendorId: normalizeFilterValue(vendorFilter.value),
      purchaseOrderId: normalizeFilterValue(purchaseOrderFilter.value),
      status: normalizeFilterValue(statusFilter.value),
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
  void loadVendorInvoices()
}

function resetForm() {
  Object.assign(vendorInvoiceForm, createVendorInvoiceForm())

  if (vendorOptions.value[0]) {
    vendorInvoiceForm.vendorId = vendorOptions.value[0].id
  }

  syncPurchaseOrderSelection()
  syncGoodsReceiptSelection()
  syncInvoiceDraftFields()
  syncFinanceAccounts()
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(invoice: VendorInvoice) {
  formMode.value = 'edit'
  editingId.value = invoice.id
  assignForm(invoice)
  syncPurchaseOrderSelection()
  syncGoodsReceiptSelection()
  syncFinanceAccounts()
  open.value = true
}

function openViewModal(invoice: VendorInvoice) {
  formMode.value = 'view'
  editingId.value = invoice.id
  assignForm(invoice)
  syncPurchaseOrderSelection()
  syncGoodsReceiptSelection()
  syncFinanceAccounts()
  open.value = true
}

async function submitVendorInvoice() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateVendorInvoice(editingId.value, vendorInvoiceForm)
      toast.add({ title: '供应商发票已更新', color: 'success' })
    } else {
      await api.createVendorInvoice(vendorInvoiceForm)
      toast.add({ title: '供应商发票已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadVendorInvoices()
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

async function removeVendorInvoice(invoice: VendorInvoice) {
  if (!window.confirm(`确认删除供应商发票“${invoice.vendorInvoiceNo}”吗？`)) {
    return
  }

  try {
    await api.deleteVendorInvoice(invoice.id)
    toast.add({ title: '供应商发票已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadVendorInvoices()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

async function executeVendorInvoice(invoice: VendorInvoice) {
  if (!window.confirm(`确认执行供应商发票“${invoice.vendorInvoiceNo}”吗？执行后会生成付款单和财务交易。`)) {
    return
  }

  try {
    const result = await api.executeVendorInvoice(invoice.id)
    toast.add({
      title: '供应商发票已执行',
      description: result.transactionCode
        ? `已生成财务交易 ${result.transactionCode}`
        : '执行结果已进入付款和财务交易视图。',
      color: 'success'
    })
    await loadVendorInvoices()
  } catch (error) {
    toast.add({
      title: '执行失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(invoice: VendorInvoice): any {
  const draftActions = invoice.status === 'DRAFT'
    ? [
        {
          label: '编辑',
          icon: 'i-lucide-pencil',
          onSelect: () => {
            openEditModal(invoice)
          }
        },
        {
          label: '执行发票',
          icon: 'i-lucide-play',
          onSelect: () => {
            void executeVendorInvoice(invoice)
          }
        },
        {
          label: '删除',
          icon: 'i-lucide-trash-2',
          color: 'error',
          onSelect: () => {
            void removeVendorInvoice(invoice)
          }
        }
      ]
    : []

  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(invoice)
      }
    },
    ...draftActions
  ]]
}

watch(page, () => {
  void loadVendorInvoices()
})

watch([statusFilter, vendorFilter, purchaseOrderFilter], () => {
  page.value = 1
  void loadVendorInvoices()
})

watch([dateFrom, dateTo], () => {
  page.value = 1
  void loadVendorInvoices()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadVendorInvoices()
  }, 250)
})

watch(() => vendorInvoiceForm.vendorId, () => {
  syncPurchaseOrderSelection()
})

watch(() => vendorInvoiceForm.purchaseOrderId, () => {
  syncGoodsReceiptSelection()
  syncInvoiceDraftFields()
})

watch(() => vendorInvoiceForm.currency, () => {
  syncFinanceAccounts()
})

watch(() => vendorInvoiceForm.payFromAccountId, () => {
  syncFinanceAccounts()
})

onMounted(async () => {
  await loadReferences()
  await loadVendorInvoices()
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
              供应商发票
            </p>
            <p class="text-sm text-muted">
              发票是采购闭环进入财务付款的关键业务单据，执行后会自动回流付款与 finance 交易结果层
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增供应商发票
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索发票单号、供应商、采购订单、收货记录或参考号" />

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
              v-model="purchaseOrderFilter"
              :items="purchaseOrderFilterItems"
              value-key="value"
              label-key="label"
              placeholder="采购订单"
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
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadVendorInvoices({ notifyInvalid: true })">
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
              正在加载供应商发票列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #goodsReceiptNo-cell="{ row }">
                {{ row.original.goodsReceiptNo || '-' }}
              </template>

              <template #amount-cell="{ row }">
                {{ formatCurrency(row.original.amount, row.original.currency) }}
              </template>

              <template #invoiceDate-cell="{ row }">
                {{ formatDate(row.original.invoiceDate) }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="procurementStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(vendorInvoiceStatusOptions, row.original.status) }}
                </UBadge>
              </template>

              <template #paymentStatus-cell="{ row }">
                <UBadge
                  :color="row.original.paymentStatus ? procurementStatusColor(row.original.paymentStatus) : 'neutral'"
                  variant="subtle"
                >
                  {{
                    row.original.paymentStatus
                      ? findOptionLabel(paymentStatusOptions, row.original.paymentStatus)
                      : '-'
                  }}
                </UBadge>
              </template>

              <template #transactionCode-cell="{ row }">
                <div class="space-y-1 text-right">
                  <div>{{ row.original.transactionCode || '-' }}</div>
                  <UBadge
                    v-if="row.original.transactionStatus"
                    :color="statusColor(row.original.transactionStatus)"
                    variant="soft"
                  >
                    {{ findOptionLabel(transactionStatusOptions as SelectOption<TransactionStatus>[], row.original.transactionStatus) }}
                  </UBadge>
                </div>
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
          :title="formMode === 'view' ? '供应商发票详情' : formMode === 'edit' ? '编辑供应商发票' : '新增供应商发票'"
          description="供应商发票执行后会自动生成付款单并过账到 finance 交易结果层，不再单独维护额外财务页面。"
          :ui="{
            content: 'max-w-[min(96vw,80rem)]',
            body: 'flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6',
            footer: 'border-t border-default p-4 sm:px-6'
          }"
        >
          <template #body>
            <UForm id="vendor-invoice-form" :schema="vendorInvoiceSchema" :state="vendorInvoiceForm" class="space-y-4" @submit="submitVendorInvoice">
              <UAlert
                color="info"
                variant="subtle"
                icon="i-lucide-shield-check"
                description="付款账户已限制为资产类科目，费用账户已限制为费用类科目；前端会收口下拉选项，后端也会拒绝非法账户。"
              />

              <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <UFormField name="vendorInvoiceNo" label="发票单号">
                  <UInput v-model="vendorInvoiceForm.vendorInvoiceNo" :disabled="isReadonly" placeholder="为空则自动生成" />
                </UFormField>

                <UFormField name="status" label="业务状态" required>
                  <USelect
                    v-model="vendorInvoiceForm.status"
                    :items="editableStatusItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="vendorId" label="供应商" required class="xl:col-span-2">
                  <USelect
                    v-model="vendorInvoiceForm.vendorId"
                    :items="vendorFormItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="purchaseOrderId" label="采购订单" required class="xl:col-span-2">
                  <USelect
                    v-model="vendorInvoiceForm.purchaseOrderId"
                    :items="currentPurchaseOrderItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="goodsReceiptId" label="关联收货记录" class="xl:col-span-2">
                  <USelect
                    v-model="goodsReceiptSelectValue"
                    :items="currentGoodsReceiptItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="currency" label="币种" required>
                  <UInput v-model="vendorInvoiceForm.currency" :disabled="isReadonly" placeholder="如 CNY" />
                </UFormField>

                <UFormField name="payFromAccountId" label="付款账户" required class="xl:col-span-2">
                  <USelect
                    v-model="vendorInvoiceForm.payFromAccountId"
                    :items="payFromAccountItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="expenseAccountId" label="费用账户" required class="xl:col-span-2">
                  <USelect
                    v-model="vendorInvoiceForm.expenseAccountId"
                    :items="expenseAccountItems"
                    value-key="value"
                    label-key="label"
                    :disabled="isReadonly"
                  />
                </UFormField>

                <UFormField name="amount" label="发票金额" required>
                  <UInput v-model.number="vendorInvoiceForm.amount" :disabled="isReadonly" type="number" min="0" step="0.01" placeholder="请输入发票金额" />
                </UFormField>

                <UFormField name="invoiceDate" label="发票日期" required>
                  <UInput v-model="vendorInvoiceForm.invoiceDate" :disabled="isReadonly" type="date" />
                </UFormField>

                <UFormField name="referenceNo" label="参考号">
                  <UInput v-model="vendorInvoiceForm.referenceNo" :disabled="isReadonly" placeholder="可选外部参考号" />
                </UFormField>

                <UFormField label="采购金额">
                  <div class="flex h-10 items-center rounded-md border border-default bg-muted/30 px-3 text-sm text-toned">
                    {{ selectedPurchaseOrder ? formatCurrency(selectedPurchaseOrder.amount, selectedPurchaseOrder.currency) : '-' }}
                  </div>
                </UFormField>

                <UFormField label="商品 / 物料">
                  <div class="flex h-10 items-center rounded-md border border-default bg-muted/30 px-3 text-sm text-toned">
                    {{ selectedPurchaseOrder?.productName || '-' }}
                  </div>
                </UFormField>

                <UFormField label="收货摘要">
                  <div class="flex h-10 items-center rounded-md border border-default bg-muted/30 px-3 text-sm text-toned">
                    {{ selectedGoodsReceipt ? `${selectedGoodsReceipt.goodsReceiptNo} / ${selectedGoodsReceipt.quantity}` : '-' }}
                  </div>
                </UFormField>

                <UFormField name="description" label="描述" class="lg:col-span-2 xl:col-span-3">
                  <UTextarea
                    v-model="vendorInvoiceForm.description"
                    :disabled="isReadonly"
                    :rows="4"
                    placeholder="补充发票抬头、结算说明或内部备注"
                  />
                </UFormField>

                <UFormField v-if="formMode === 'view'" label="付款结果">
                  <div class="flex h-10 items-center rounded-md border border-default bg-muted/30 px-3 text-sm text-toned">
                    {{ editingId ? rows.find((item) => item.id === editingId)?.paymentOrderNo || '-' : '-' }}
                  </div>
                </UFormField>

                <UFormField v-if="formMode === 'view'" label="财务交易">
                  <div class="flex h-10 items-center rounded-md border border-default bg-muted/30 px-3 text-sm text-toned">
                    {{ editingId ? rows.find((item) => item.id === editingId)?.transactionCode || '-' : '-' }}
                  </div>
                </UFormField>
              </div>
            </UForm>
          </template>

          <template #footer>
            <div class="flex w-full justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="open = false">
                {{ isReadonly ? '关闭' : '取消' }}
              </UButton>
              <UButton v-if="!isReadonly" type="submit" form="vendor-invoice-form" color="primary" :loading="submitting">
                保存
              </UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </template>
  </UDashboardPanel>
</template>
