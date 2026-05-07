<script setup lang="ts">
import { z } from 'zod'

import type {
  GoodsReceipt,
  GoodsReceiptFormState,
  GoodsReceiptStatus,
  Product,
  PurchaseOrder,
  Vendor
} from '~/types/procurement'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatDate,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { goodsReceiptStatusOptions, procurementStatusColor } from '~/utils/procurement'

const api = useProcurementApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<GoodsReceipt[]>([])
const purchaseOrderOptions = ref<PurchaseOrder[]>([])
const vendorOptions = ref<Vendor[]>([])
const productOptions = ref<Product[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<GoodsReceiptStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const purchaseOrderFilter = ref(FILTER_ALL_VALUE)
const vendorFilter = ref(FILTER_ALL_VALUE)
const dateFrom = ref('')
const dateTo = ref('')

const statusItems = toSelectItems(goodsReceiptStatusOptions)

const goodsReceiptSchema = z.object({
  goodsReceiptNo: z.string().optional(),
  purchaseOrderId: z.string().min(1, '请选择采购订单'),
  quantity: z.number().positive('请输入大于 0 的数量'),
  receiptDate: z.string().min(1, '请选择收货日期'),
  status: z.string().min(1, '请选择状态'),
  referenceNo: z.string().optional(),
  description: z.string().optional()
})

const goodsReceiptForm = reactive<GoodsReceiptFormState>(createGoodsReceiptForm())

const columns = [
  { accessorKey: 'goodsReceiptNo', header: '收货单号' },
  { accessorKey: 'purchaseOrderNo', header: '采购订单' },
  { accessorKey: 'vendorName', header: '供应商' },
  { accessorKey: 'productName', header: '商品 / 物料' },
  { accessorKey: 'quantity', header: '数量' },
  { accessorKey: 'receiptDate', header: '收货日期' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const purchaseOrderFilterItems = computed(() => [
  { label: '全部采购订单', value: FILTER_ALL_VALUE },
  ...purchaseOrderOptions.value.map((purchaseOrder) => ({
    label: `${purchaseOrder.purchaseOrderNo} / ${purchaseOrder.vendorName || '-'}`,
    value: purchaseOrder.id
  }))
])

const vendorFilterItems = computed(() => [
  { label: '全部供应商', value: FILTER_ALL_VALUE },
  ...vendorOptions.value.map((vendor) => ({
    label: `${vendor.vendorName} / ${vendor.vendorCode}`,
    value: vendor.id
  }))
])

const purchaseOrderFormItems = computed(() => purchaseOrderOptions.value.map((purchaseOrder) => ({
  label: `${purchaseOrder.purchaseOrderNo} / ${purchaseOrder.productName || '-'} / ${purchaseOrder.vendorName || '-'}`,
  value: purchaseOrder.id
})))

const selectedPurchaseOrder = computed(() => {
  return purchaseOrderOptions.value.find((item) => item.id === goodsReceiptForm.purchaseOrderId) || null
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

function createGoodsReceiptForm(): GoodsReceiptFormState {
  return {
    goodsReceiptNo: '',
    purchaseOrderId: '',
    quantity: undefined,
    receiptDate: new Date().toISOString().slice(0, 10),
    status: 'DRAFT',
    referenceNo: '',
    description: ''
  }
}

function assignForm(goodsReceipt: GoodsReceipt) {
  Object.assign(goodsReceiptForm, {
    goodsReceiptNo: goodsReceipt.goodsReceiptNo,
    purchaseOrderId: goodsReceipt.purchaseOrderId,
    quantity: goodsReceipt.quantity,
    receiptDate: goodsReceipt.receiptDate,
    status: goodsReceipt.status,
    referenceNo: goodsReceipt.referenceNo || '',
    description: goodsReceipt.description || ''
  })
}

async function loadReferences() {
  const [purchaseOrders, vendors, products] = await Promise.all([
    api.listPurchaseOrders({ page: 1, limit: 200 }),
    api.listVendors({ page: 1, limit: 200 }),
    api.listProducts({ page: 1, limit: 200 })
  ])

  purchaseOrderOptions.value = purchaseOrders.data
  vendorOptions.value = vendors.data
  productOptions.value = products.data
}

async function loadGoodsReceipts(options: { notifyInvalid?: boolean } = {}) {
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
    const result = await api.listGoodsReceipts({
      page: page.value,
      limit,
      search: search.value || undefined,
      purchaseOrderId: normalizeFilterValue(purchaseOrderFilter.value),
      vendorId: normalizeFilterValue(vendorFilter.value),
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
  void loadGoodsReceipts()
}

function resetForm() {
  Object.assign(goodsReceiptForm, createGoodsReceiptForm())

  if (purchaseOrderOptions.value[0]) {
    goodsReceiptForm.purchaseOrderId = purchaseOrderOptions.value[0].id
    goodsReceiptForm.quantity = purchaseOrderOptions.value[0].quantity
  }
}

function syncQuantityFromPurchaseOrder() {
  if (!selectedPurchaseOrder.value) {
    return
  }

  if (!goodsReceiptForm.quantity) {
    goodsReceiptForm.quantity = selectedPurchaseOrder.value.quantity
  }
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(goodsReceipt: GoodsReceipt) {
  formMode.value = 'edit'
  editingId.value = goodsReceipt.id
  assignForm(goodsReceipt)
  open.value = true
}

function openViewModal(goodsReceipt: GoodsReceipt) {
  formMode.value = 'view'
  editingId.value = goodsReceipt.id
  assignForm(goodsReceipt)
  open.value = true
}

async function submitGoodsReceipt() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateGoodsReceipt(editingId.value, goodsReceiptForm)
      toast.add({ title: '收货记录已更新', color: 'success' })
    } else {
      await api.createGoodsReceipt(goodsReceiptForm)
      toast.add({ title: '收货记录已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadGoodsReceipts()
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

async function removeGoodsReceipt(goodsReceipt: GoodsReceipt) {
  if (!window.confirm(`确认删除收货记录“${goodsReceipt.goodsReceiptNo}”吗？`)) {
    return
  }

  try {
    await api.deleteGoodsReceipt(goodsReceipt.id)
    toast.add({ title: '收货记录已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadGoodsReceipts()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(goodsReceipt: GoodsReceipt): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(goodsReceipt)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(goodsReceipt)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeGoodsReceipt(goodsReceipt)
      }
    }
  ]]
}

watch(page, () => {
  void loadGoodsReceipts()
})

watch([statusFilter, purchaseOrderFilter, vendorFilter], () => {
  page.value = 1
  void loadGoodsReceipts()
})

watch([dateFrom, dateTo], () => {
  page.value = 1
  void loadGoodsReceipts()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadGoodsReceipts()
  }, 250)
})

watch(() => goodsReceiptForm.purchaseOrderId, () => {
  syncQuantityFromPurchaseOrder()
})

onMounted(async () => {
  await loadReferences()
  await loadGoodsReceipts()
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
              收货记录
            </p>
            <p class="text-sm text-muted">
              承接采购订单的履约结果，记录已到货数量与收货日期
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增收货记录
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索收货单号、采购订单、供应商、物料或参考号" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="purchaseOrderFilter"
              :items="purchaseOrderFilterItems"
              value-key="value"
              label-key="label"
              placeholder="采购订单"
              class="min-w-56"
            />
            <USelect
              v-model="vendorFilter"
              :items="vendorFilterItems"
              value-key="value"
              label-key="label"
              placeholder="供应商"
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
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadGoodsReceipts({ notifyInvalid: true })">
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
              正在加载收货记录列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #quantity-cell="{ row }">
                {{ row.original.quantity }} {{ productOptions.find((item) => item.id === row.original.productId)?.unit || '' }}
              </template>

              <template #receiptDate-cell="{ row }">
                {{ formatDate(row.original.receiptDate) }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="procurementStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(goodsReceiptStatusOptions, row.original.status) }}
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
                    {{ formMode === 'view' ? '收货记录详情' : formMode === 'edit' ? '编辑收货记录' : '新增收货记录' }}
                  </p>
                  <p class="text-sm text-muted">
                    收货记录是业务履约状态，不直接生成财务结果；后续由供应商发票继续进入付款链路。
                  </p>
                </div>
              </template>

              <UForm :schema="goodsReceiptSchema" :state="goodsReceiptForm" class="space-y-4" @submit="submitGoodsReceipt">
                <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  <UFormField name="goodsReceiptNo" label="收货单号">
                    <UInput v-model="goodsReceiptForm.goodsReceiptNo" :disabled="isReadonly" placeholder="为空则自动生成" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="goodsReceiptForm.status"
                      :items="goodsReceiptStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="purchaseOrderId" label="采购订单" required class="lg:col-span-2 xl:col-span-3">
                    <USelect
                      v-model="goodsReceiptForm.purchaseOrderId"
                      :items="purchaseOrderFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField label="供应商">
                    <div class="flex h-10 items-center rounded-md border border-default bg-muted/30 px-3 text-sm text-toned">
                      {{ selectedPurchaseOrder?.vendorName || '-' }}
                    </div>
                  </UFormField>

                  <UFormField label="商品 / 物料">
                    <div class="flex h-10 items-center rounded-md border border-default bg-muted/30 px-3 text-sm text-toned">
                      {{ selectedPurchaseOrder?.productName || '-' }}
                    </div>
                  </UFormField>

                  <UFormField name="quantity" label="收货数量" required>
                    <UInput v-model.number="goodsReceiptForm.quantity" :disabled="isReadonly" type="number" min="0" step="0.01" placeholder="请输入收货数量" />
                  </UFormField>

                  <UFormField name="receiptDate" label="收货日期" required>
                    <UInput v-model="goodsReceiptForm.receiptDate" :disabled="isReadonly" type="date" />
                  </UFormField>

                  <UFormField name="referenceNo" label="参考号">
                    <UInput v-model="goodsReceiptForm.referenceNo" :disabled="isReadonly" placeholder="可选外部参考号" />
                  </UFormField>

                  <UFormField label="订单数量">
                    <div class="flex h-10 items-center rounded-md border border-default bg-muted/30 px-3 text-sm text-toned">
                      {{ selectedPurchaseOrder ? `${selectedPurchaseOrder.quantity}` : '-' }}
                    </div>
                  </UFormField>

                  <UFormField name="description" label="描述" class="lg:col-span-2 xl:col-span-3">
                    <UTextarea
                      v-model="goodsReceiptForm.description"
                      :disabled="isReadonly"
                      :rows="4"
                      placeholder="补充收货说明、到货情况或内部备注"
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
