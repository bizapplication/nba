<script setup lang="ts">
import { z } from 'zod'

import type {
  Product,
  PurchaseOrder,
  PurchaseOrderFormState,
  PurchaseOrderStatus,
  Vendor
} from '~/types/procurement'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { procurementStatusColor, purchaseOrderStatusOptions } from '~/utils/procurement'

const api = useProcurementApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<PurchaseOrder[]>([])
const vendorOptions = ref<Vendor[]>([])
const productOptions = ref<Product[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<PurchaseOrderStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const vendorFilter = ref(FILTER_ALL_VALUE)
const productFilter = ref(FILTER_ALL_VALUE)
const dateFrom = ref('')
const dateTo = ref('')

const statusItems = toSelectItems(purchaseOrderStatusOptions)

const purchaseOrderSchema = z.object({
  purchaseOrderNo: z.string().optional(),
  vendorId: z.string().min(1, '请选择供应商'),
  productId: z.string().min(1, '请选择物料'),
  quantity: z.number().positive('请输入大于 0 的数量'),
  unitPrice: z.number().positive('请输入大于 0 的单价'),
  currency: z.string().min(3, '请输入币种'),
  orderDate: z.string().min(1, '请选择下单日期'),
  status: z.string().min(1, '请选择状态'),
  referenceNo: z.string().optional(),
  description: z.string().optional()
})

const purchaseOrderForm = reactive<PurchaseOrderFormState>(createPurchaseOrderForm())

const columns = [
  { accessorKey: 'purchaseOrderNo', header: '采购单号' },
  { accessorKey: 'vendorName', header: '供应商' },
  { accessorKey: 'productName', header: '商品 / 物料' },
  { accessorKey: 'quantity', header: '数量' },
  { accessorKey: 'amount', header: '金额' },
  { accessorKey: 'orderDate', header: '下单日期' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'goodsReceiptCount', header: '收货数' },
  { accessorKey: 'invoiceCount', header: '发票数' },
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

const productFilterItems = computed(() => [
  { label: '全部物料', value: FILTER_ALL_VALUE },
  ...productOptions.value.map((product) => ({
    label: `${product.productName} / ${product.productCode}`,
    value: product.id
  }))
])

const vendorFormItems = computed(() => vendorOptions.value.map((vendor) => ({
  label: `${vendor.vendorName} / ${vendor.vendorCode}`,
  value: vendor.id
})))

const productFormItems = computed(() => productOptions.value.map((product) => ({
  label: `${product.productName} / ${product.productCode}`,
  value: product.id
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

const amountPreview = computed(() => {
  if (!purchaseOrderForm.quantity || !purchaseOrderForm.unitPrice) {
    return 0
  }

  return Number((purchaseOrderForm.quantity * purchaseOrderForm.unitPrice).toFixed(2))
})

function createPurchaseOrderForm(): PurchaseOrderFormState {
  return {
    purchaseOrderNo: '',
    vendorId: '',
    productId: '',
    quantity: undefined,
    unitPrice: undefined,
    currency: 'CNY',
    orderDate: new Date().toISOString().slice(0, 10),
    status: 'DRAFT',
    referenceNo: '',
    description: ''
  }
}

function assignForm(purchaseOrder: PurchaseOrder) {
  Object.assign(purchaseOrderForm, {
    purchaseOrderNo: purchaseOrder.purchaseOrderNo,
    vendorId: purchaseOrder.vendorId,
    productId: purchaseOrder.productId,
    quantity: purchaseOrder.quantity,
    unitPrice: purchaseOrder.unitPrice,
    currency: purchaseOrder.currency,
    orderDate: purchaseOrder.orderDate,
    status: purchaseOrder.status,
    referenceNo: purchaseOrder.referenceNo || '',
    description: purchaseOrder.description || ''
  })
}

async function loadReferences() {
  const [vendors, products] = await Promise.all([
    api.listVendors({ page: 1, limit: 200 }),
    api.listProducts({ page: 1, limit: 200 })
  ])

  vendorOptions.value = vendors.data
  productOptions.value = products.data
}

async function loadPurchaseOrders(options: { notifyInvalid?: boolean } = {}) {
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
    const result = await api.listPurchaseOrders({
      page: page.value,
      limit,
      search: search.value || undefined,
      vendorId: normalizeFilterValue(vendorFilter.value),
      productId: normalizeFilterValue(productFilter.value),
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
  void loadPurchaseOrders()
}

function resetForm() {
  Object.assign(purchaseOrderForm, createPurchaseOrderForm())

  if (vendorOptions.value[0]) {
    purchaseOrderForm.vendorId = vendorOptions.value[0].id
  }

  if (productOptions.value[0]) {
    purchaseOrderForm.productId = productOptions.value[0].id
  }
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(purchaseOrder: PurchaseOrder) {
  formMode.value = 'edit'
  editingId.value = purchaseOrder.id
  assignForm(purchaseOrder)
  open.value = true
}

function openViewModal(purchaseOrder: PurchaseOrder) {
  formMode.value = 'view'
  editingId.value = purchaseOrder.id
  assignForm(purchaseOrder)
  open.value = true
}

async function submitPurchaseOrder() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updatePurchaseOrder(editingId.value, purchaseOrderForm)
      toast.add({ title: '采购订单已更新', color: 'success' })
    } else {
      await api.createPurchaseOrder(purchaseOrderForm)
      toast.add({ title: '采购订单已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadPurchaseOrders()
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

async function removePurchaseOrder(purchaseOrder: PurchaseOrder) {
  if (!window.confirm(`确认删除采购订单“${purchaseOrder.purchaseOrderNo}”吗？`)) {
    return
  }

  try {
    await api.deletePurchaseOrder(purchaseOrder.id)
    toast.add({ title: '采购订单已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadPurchaseOrders()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(purchaseOrder: PurchaseOrder): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(purchaseOrder)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(purchaseOrder)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removePurchaseOrder(purchaseOrder)
      }
    }
  ]]
}

watch(page, () => {
  void loadPurchaseOrders()
})

watch([statusFilter, vendorFilter, productFilter], () => {
  page.value = 1
  void loadPurchaseOrders()
})

watch([dateFrom, dateTo], () => {
  page.value = 1
  void loadPurchaseOrders()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadPurchaseOrders()
  }, 250)
})

onMounted(async () => {
  await loadReferences()
  await loadPurchaseOrders()
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
              采购订单
            </p>
            <p class="text-sm text-muted">
              采购业务起点，不直接生成财务交易，后续由收货和发票继续推进
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增采购订单
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索采购单号、供应商、物料或参考号" />

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
              v-model="productFilter"
              :items="productFilterItems"
              value-key="value"
              label-key="label"
              placeholder="物料"
              class="min-w-56"
            />
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
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
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadPurchaseOrders({ notifyInvalid: true })">
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
              正在加载采购订单列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #quantity-cell="{ row }">
                {{ row.original.quantity }} {{ productOptions.find((item) => item.id === row.original.productId)?.unit || '' }}
              </template>

              <template #amount-cell="{ row }">
                {{ formatCurrency(row.original.amount, row.original.currency) }}
              </template>

              <template #orderDate-cell="{ row }">
                {{ formatDate(row.original.orderDate) }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="procurementStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(purchaseOrderStatusOptions, row.original.status) }}
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
                    {{ formMode === 'view' ? '采购订单详情' : formMode === 'edit' ? '编辑采购订单' : '新增采购订单' }}
                  </p>
                  <p class="text-sm text-muted">
                    采购订单只承载业务起点，不会直接进入财务交易；下游由收货和供应商发票继续推进。
                  </p>
                </div>
              </template>

              <UForm :schema="purchaseOrderSchema" :state="purchaseOrderForm" class="space-y-4" @submit="submitPurchaseOrder">
                <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  <UFormField name="purchaseOrderNo" label="采购单号">
                    <UInput v-model="purchaseOrderForm.purchaseOrderNo" :disabled="isReadonly" placeholder="为空则自动生成" />
                  </UFormField>

                  <UFormField name="currency" label="币种" required>
                    <UInput v-model="purchaseOrderForm.currency" :disabled="isReadonly" placeholder="如 CNY" />
                  </UFormField>

                  <UFormField name="vendorId" label="供应商" required class="xl:col-span-2">
                    <USelect
                      v-model="purchaseOrderForm.vendorId"
                      :items="vendorFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="productId" label="商品 / 物料" required class="xl:col-span-2">
                    <USelect
                      v-model="purchaseOrderForm.productId"
                      :items="productFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="quantity" label="数量" required>
                    <UInput v-model.number="purchaseOrderForm.quantity" :disabled="isReadonly" type="number" min="0" step="0.01" placeholder="请输入数量" />
                  </UFormField>

                  <UFormField name="unitPrice" label="单价" required>
                    <UInput v-model.number="purchaseOrderForm.unitPrice" :disabled="isReadonly" type="number" min="0" step="0.01" placeholder="请输入单价" />
                  </UFormField>

                  <UFormField name="orderDate" label="下单日期" required>
                    <UInput v-model="purchaseOrderForm.orderDate" :disabled="isReadonly" type="date" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="purchaseOrderForm.status"
                      :items="purchaseOrderStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="referenceNo" label="参考号">
                    <UInput v-model="purchaseOrderForm.referenceNo" :disabled="isReadonly" placeholder="可选外部参考号" />
                  </UFormField>

                  <UFormField label="订单金额预览">
                    <div class="flex h-10 items-center rounded-md border border-default bg-muted/30 px-3 text-sm text-toned">
                      {{ formatCurrency(amountPreview, purchaseOrderForm.currency || 'CNY') }}
                    </div>
                  </UFormField>

                  <UFormField name="description" label="描述" class="lg:col-span-2 xl:col-span-3">
                    <UTextarea
                      v-model="purchaseOrderForm.description"
                      :disabled="isReadonly"
                      :rows="4"
                      placeholder="补充采购说明、交付要求或内部备注"
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
