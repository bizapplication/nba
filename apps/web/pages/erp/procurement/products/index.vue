<script setup lang="ts">
import { z } from 'zod'

import type { Product, ProductFormState, ProductStatus } from '~/types/procurement'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { procurementStatusColor, productStatusOptions } from '~/utils/procurement'

const api = useProcurementApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Product[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<ProductStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const statusItems = toSelectItems(productStatusOptions)

const productSchema = z.object({
  productCode: z.string().min(1, '请输入物料编码'),
  productName: z.string().min(1, '请输入物料名称'),
  unit: z.string().min(1, '请输入单位'),
  status: z.string().min(1, '请选择状态'),
  description: z.string().optional()
})

const productForm = reactive<ProductFormState>(createProductForm())

const columns = [
  { accessorKey: 'productCode', header: '物料编码' },
  { accessorKey: 'productName', header: '物料名称' },
  { accessorKey: 'unit', header: '单位' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

function createProductForm(): ProductFormState {
  return {
    productCode: '',
    productName: '',
    unit: 'EA',
    status: 'active',
    description: ''
  }
}

function assignForm(product: Product) {
  Object.assign(productForm, {
    productCode: product.productCode,
    productName: product.productName,
    unit: product.unit,
    status: product.status,
    description: product.description || ''
  })
}

async function loadProducts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listProducts({
      page: page.value,
      limit,
      search: search.value || undefined,
      status: normalizeFilterValue(statusFilter.value)
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
  Object.assign(productForm, createProductForm())
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(product: Product) {
  formMode.value = 'edit'
  editingId.value = product.id
  assignForm(product)
  open.value = true
}

function openViewModal(product: Product) {
  formMode.value = 'view'
  editingId.value = product.id
  assignForm(product)
  open.value = true
}

async function submitProduct() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateProduct(editingId.value, productForm)
      toast.add({ title: '物料已更新', color: 'success' })
    } else {
      await api.createProduct(productForm)
      toast.add({ title: '物料已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadProducts()
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

async function removeProduct(product: Product) {
  if (!window.confirm(`确认删除物料“${product.productName}”吗？`)) {
    return
  }

  try {
    await api.deleteProduct(product.id)
    toast.add({ title: '物料已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadProducts()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(product: Product): any {
  const editableActions = [
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(product)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeProduct(product)
      }
    }
  ]

  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(product)
      }
    },
    ...editableActions
  ]]
}

watch(page, () => {
  void loadProducts()
})

watch(statusFilter, () => {
  page.value = 1
  void loadProducts()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadProducts()
  }, 250)
})

onMounted(async () => {
  await loadProducts()
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
              商品 / 物料
            </p>
            <p class="text-sm text-muted">
              采购主数据，作为采购订单、收货与发票的统一商品入口
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增物料
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索物料编码、名称、单位或描述" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
              class="min-w-40"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadProducts">
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
              正在加载物料列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #status-cell="{ row }">
                <UBadge :color="procurementStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(productStatusOptions, row.original.status) }}
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
            <UCard class="sm:max-w-2xl">
              <template #header>
                <div>
                  <p class="text-base font-semibold text-highlighted">
                    {{ formMode === 'view' ? '物料详情' : formMode === 'edit' ? '编辑物料' : '新增物料' }}
                  </p>
                  <p class="text-sm text-muted">
                    物料主数据不会直接生成财务结果，但会作为采购业务链路的统一商品引用。
                  </p>
                </div>
              </template>

              <UForm :schema="productSchema" :state="productForm" class="space-y-4" @submit="submitProduct">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="productCode" label="物料编码" required>
                    <UInput v-model="productForm.productCode" :disabled="isReadonly" placeholder="如 PROD-0003" />
                  </UFormField>

                  <UFormField name="unit" label="单位" required>
                    <UInput v-model="productForm.unit" :disabled="isReadonly" placeholder="如 EA / PCS / BOX" />
                  </UFormField>

                  <UFormField name="productName" label="物料名称" required class="lg:col-span-2">
                    <UInput v-model="productForm.productName" :disabled="isReadonly" placeholder="请输入物料名称" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="productForm.status"
                      :items="productStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="description" label="描述" class="lg:col-span-2">
                    <UTextarea
                      v-model="productForm.description"
                      :disabled="isReadonly"
                      :rows="4"
                      placeholder="补充物料用途、规格或采购说明"
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
