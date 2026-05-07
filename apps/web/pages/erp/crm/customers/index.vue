<script setup lang="ts">
import { z } from 'zod'

import type { Customer, CustomerFormState, CustomerStatus } from '~/types/crm'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { crmStatusColor, customerStatusOptions } from '~/utils/crm'

const api = useCrmApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Customer[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<CustomerStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)

const statusItems = toSelectItems(customerStatusOptions)

const customerSchema = z.object({
  customerCode: z.string().min(1, '请输入客户编码'),
  customerName: z.string().min(1, '请输入客户名称'),
  shortName: z.string().min(1, '请输入客户简称'),
  status: z.enum(['active', 'inactive']),
  defaultCurrency: z.string().min(3, '请输入默认币种'),
  description: z.string().optional()
})

const customerForm = reactive<CustomerFormState>(createCustomerForm())

const columns = [
  { accessorKey: 'customerCode', header: '客户编码' },
  { accessorKey: 'customerName', header: '客户名称' },
  { accessorKey: 'shortName', header: '简称' },
  { accessorKey: 'defaultBankAccountName', header: '默认付款账户' },
  { accessorKey: 'bankAccountCount', header: '账户数' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const modalTitle = computed(() => {
  if (formMode.value === 'view') {
    return '客户详情'
  }

  if (formMode.value === 'edit') {
    return '编辑客户'
  }

  return '新增客户'
})

function createCustomerForm(): CustomerFormState {
  return {
    customerCode: '',
    customerName: '',
    shortName: '',
    status: 'active',
    defaultCurrency: 'CNY',
    description: ''
  }
}

function assignForm(customer: Customer) {
  Object.assign(customerForm, {
    customerCode: customer.customerCode,
    customerName: customer.customerName,
    shortName: customer.shortName,
    status: customer.status,
    defaultCurrency: customer.defaultCurrency,
    description: customer.description || ''
  })
}

async function loadCustomers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listCustomers({
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
  Object.assign(customerForm, createCustomerForm())
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(customer: Customer) {
  formMode.value = 'edit'
  editingId.value = customer.id
  assignForm(customer)
  open.value = true
}

function openViewModal(customer: Customer) {
  formMode.value = 'view'
  editingId.value = customer.id
  assignForm(customer)
  open.value = true
}

async function submitCustomer() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateCustomer(editingId.value, customerForm)
      toast.add({ title: '客户已更新', color: 'success' })
    } else {
      await api.createCustomer(customerForm)
      toast.add({ title: '客户已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadCustomers()
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

async function removeCustomer(customer: Customer) {
  if (!window.confirm(`确认删除客户“${customer.customerName}”吗？`)) {
    return
  }

  try {
    await api.deleteCustomer(customer.id)
    toast.add({ title: '客户已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadCustomers()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(customer: Customer): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(customer)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(customer)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeCustomer(customer)
      }
    }
  ]]
}

watch(page, () => {
  void loadCustomers()
})

watch(statusFilter, () => {
  page.value = 1
  void loadCustomers()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadCustomers()
  }, 250)
})

onMounted(() => {
  void loadCustomers()
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
              客户管理
            </p>
            <p class="text-sm text-muted">
              维护客户主数据、默认币种与启停状态
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增客户
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索客户名称、编码或简称" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
              class="min-w-36"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadCustomers">
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
              正在加载客户列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #defaultBankAccountName-cell="{ row }">
                {{ row.original.defaultBankAccountName || '-' }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="crmStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(customerStatusOptions, row.original.status) }}
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
                    {{ modalTitle }}
                  </p>
                  <p class="text-sm text-muted">
                    客户主数据用于承接后续收款单和销售类业务单据。
                  </p>
                </div>
              </template>

              <UForm :schema="customerSchema" :state="customerForm" class="space-y-4" @submit="submitCustomer">
                <div class="grid gap-4 md:grid-cols-2">
                  <UFormField label="客户编码" name="customerCode">
                    <UInput v-model="customerForm.customerCode" :disabled="isReadonly" placeholder="如 CUST-0001" />
                  </UFormField>
                  <UFormField label="客户名称" name="customerName">
                    <UInput v-model="customerForm.customerName" :disabled="isReadonly" placeholder="请输入客户名称" />
                  </UFormField>
                  <UFormField label="客户简称" name="shortName">
                    <UInput v-model="customerForm.shortName" :disabled="isReadonly" placeholder="请输入客户简称" />
                  </UFormField>
                  <UFormField label="默认币种" name="defaultCurrency">
                    <UInput v-model="customerForm.defaultCurrency" :disabled="isReadonly" placeholder="如 CNY" />
                  </UFormField>
                  <UFormField label="状态" name="status">
                    <USelect
                      v-model="customerForm.status"
                      :items="customerStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>
                </div>

                <UFormField label="描述" name="description">
                  <UTextarea v-model="customerForm.description" :disabled="isReadonly" :rows="4" placeholder="可选，补充客户说明" />
                </UFormField>

                <div v-if="!isReadonly" class="flex justify-end gap-3">
                  <UButton color="neutral" variant="ghost" @click="open = false">
                    取消
                  </UButton>
                  <UButton type="submit" color="primary" :loading="submitting">
                    {{ formMode === 'edit' ? '保存更新' : '创建客户' }}
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
