<script setup lang="ts">
import { z } from 'zod'

import type {
  CrmCustomer,
  CrmOrder,
  CrmOrderFormState,
  CrmOrderStatus,
} from '~/types/crm-domain'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatCurrency,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems,
} from '~/utils/finance'
import { crmOrderStatusColor, crmOrderStatusOptions } from '~/utils/crm-domain'

const api = useCrmDomainApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<CrmOrder[]>([])
const customerOptions = ref<CrmCustomer[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<CrmOrderStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const customerFilter = ref(FILTER_ALL_VALUE)

let searchTimer: ReturnType<typeof setTimeout> | undefined

const statusItems = toSelectItems(crmOrderStatusOptions)

const orderSchema = z.object({
  orderNo: z.string().min(1, '请输入订单号'),
  customerId: z.string().min(1, '请选择客户'),
  name: z.string().min(1, '请输入订单名称'),
  description: z.string().min(1, '请输入订单说明'),
  amount: z.number().positive('请输入大于 0 的金额'),
  status: z.enum(['draft', 'confirmed', 'completed', 'cancelled']),
})

const orderForm = reactive<CrmOrderFormState>(createOrderForm())

const columns = [
  { accessorKey: 'orderNo', header: '订单号' },
  { accessorKey: 'name', header: '订单名称' },
  { accessorKey: 'customerName', header: '客户' },
  { accessorKey: 'amount', header: '金额' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'updatedAt', header: '更新时间' },
  { id: 'actions', header: '操作' }
]

const isReadonly = computed(() => formMode.value === 'view')

const modalTitle = computed(() => {
  if (formMode.value === 'view') {
    return '订单详情'
  }

  if (formMode.value === 'edit') {
    return '编辑订单'
  }

  return '新增订单'
})

const customerItems = computed(() => customerOptions.value.map((customer) => ({
  label: `${customer.name} / ${customer.company}`,
  value: customer.id,
})))

const customerFilterItems = computed(() => [
  { label: '全部客户', value: FILTER_ALL_VALUE },
  ...customerItems.value,
])

function createOrderForm(): CrmOrderFormState {
  return {
    orderNo: '',
    customerId: '',
    name: '',
    description: '',
    amount: undefined,
    status: 'draft',
  }
}

function assignForm(order: CrmOrder) {
  Object.assign(orderForm, {
    orderNo: order.orderNo,
    customerId: order.customerId,
    name: order.name,
    description: order.description,
    amount: order.amount,
    status: order.status,
  })
}

async function loadCustomers() {
  const result = await api.listCustomers({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  customerOptions.value = result.data
}

async function loadOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listOrders({
      page: page.value,
      limit,
      keyword: search.value || undefined,
      status: normalizeFilterValue(statusFilter.value),
      customerId: normalizeFilterValue(customerFilter.value),
      sortBy: 'updatedAt',
      sortOrder: 'desc',
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
  Object.assign(orderForm, createOrderForm())
  orderForm.customerId = customerOptions.value[0]?.id || ''
}

function openCreateModal() {
  if (!customerOptions.value.length) {
    toast.add({
      title: '请先创建客户',
      description: '订单需要绑定客户后才能创建。',
      color: 'warning'
    })
    return
  }

  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(order: CrmOrder) {
  formMode.value = 'edit'
  editingId.value = order.id
  assignForm(order)
  open.value = true
}

function openViewModal(order: CrmOrder) {
  formMode.value = 'view'
  editingId.value = order.id
  assignForm(order)
  open.value = true
}

async function submitOrder() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateOrder(editingId.value, orderForm)
      toast.add({ title: '订单已更新', color: 'success' })
    } else {
      await api.createOrder(orderForm)
      toast.add({ title: '订单已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadOrders()
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

async function removeOrder(order: CrmOrder) {
  if (!window.confirm(`确认删除订单“${order.orderNo}”吗？`)) {
    return
  }

  try {
    await api.deleteOrder(order.id)
    toast.add({ title: '订单已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadOrders()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(order: CrmOrder): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(order)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(order)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeOrder(order)
      }
    }
  ]]
}

watch(page, () => {
  void loadOrders()
})

watch([statusFilter, customerFilter], () => {
  page.value = 1
  void loadOrders()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadOrders()
  }, 250)
})

onMounted(async () => {
  await loadCustomers()
  await loadOrders()
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
              订单管理
            </p>
            <p class="text-sm text-muted">
              维护 CRM 域内的客户订单结果层与履约状态
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" :disabled="!customerOptions.length" @click="openCreateModal">
            新增订单
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索订单号、订单名称或描述" />

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
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
              class="min-w-40"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadOrders">
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
              正在加载订单列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #customerName-cell="{ row }">
                {{ row.original.customerName || '-' }}
              </template>

              <template #amount-cell="{ row }">
                {{ formatCurrency(row.original.amount) }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="crmOrderStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(crmOrderStatusOptions, row.original.status) }}
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
            <UCard class="sm:max-w-3xl">
              <template #header>
                <div>
                  <p class="text-base font-semibold text-highlighted">
                    {{ modalTitle }}
                  </p>
                  <p class="text-sm text-muted">
                    订单与客户主档直接关联，用来承接 CRM 域内的成交结果。
                  </p>
                </div>
              </template>

              <UForm :schema="orderSchema" :state="orderForm" class="space-y-4" @submit="submitOrder">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="orderNo" label="订单号" required>
                    <UInput v-model="orderForm.orderNo" :disabled="isReadonly" placeholder="例如 SO-2026-0001" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="orderForm.status"
                      :items="crmOrderStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="customerId" label="客户" required class="lg:col-span-2">
                    <USelect
                      v-model="orderForm.customerId"
                      :items="customerItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="name" label="订单名称" required class="lg:col-span-2">
                    <UInput v-model="orderForm.name" :disabled="isReadonly" placeholder="请输入订单名称" />
                  </UFormField>

                  <UFormField name="amount" label="订单金额" required>
                    <UInput v-model.number="orderForm.amount" :disabled="isReadonly" type="number" min="0" step="0.01" placeholder="请输入金额" />
                  </UFormField>

                  <UFormField name="description" label="订单说明" required class="lg:col-span-2">
                    <UTextarea
                      v-model="orderForm.description"
                      :rows="5"
                      :disabled="isReadonly"
                      placeholder="补充订单范围、交付说明和关键备注"
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
