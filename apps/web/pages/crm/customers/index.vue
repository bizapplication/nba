<script setup lang="ts">
import { z } from 'zod'

import type { CrmCustomer, CrmCustomerFormState } from '~/types/crm-domain'
import { formatDateTime } from '~/utils/finance'

const api = useCrmDomainApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<CrmCustomer[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')
const search = ref('')

let searchTimer: ReturnType<typeof setTimeout> | undefined

const customerSchema = z.object({
  name: z.string().min(1, '请输入客户名称'),
  email: z.string().email('请输入有效邮箱'),
  phone: z.string().min(1, '请输入联系电话'),
  company: z.string().min(1, '请输入公司名称')
})

const customerForm = reactive<CrmCustomerFormState>(createCustomerForm())

const columns = [
  { accessorKey: 'name', header: '客户名称' },
  { accessorKey: 'email', header: '邮箱' },
  { accessorKey: 'phone', header: '联系电话' },
  { accessorKey: 'company', header: '所属公司' },
  { accessorKey: 'updatedAt', header: '更新时间' },
  { id: 'actions', header: '操作' }
]

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

function createCustomerForm(): CrmCustomerFormState {
  return {
    name: '',
    email: '',
    phone: '',
    company: '',
  }
}

function assignForm(customer: CrmCustomer) {
  Object.assign(customerForm, {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
  })
}

async function loadCustomers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listCustomers({
      page: page.value,
      limit,
      keyword: search.value || undefined,
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
  Object.assign(customerForm, createCustomerForm())
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(customer: CrmCustomer) {
  formMode.value = 'edit'
  editingId.value = customer.id
  assignForm(customer)
  open.value = true
}

function openViewModal(customer: CrmCustomer) {
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

async function removeCustomer(customer: CrmCustomer) {
  if (!window.confirm(`确认删除客户“${customer.name}”吗？`)) {
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

function rowActions(customer: CrmCustomer): any {
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
              统一维护客户主数据，供商机和订单链路复用
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
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索客户名称、邮箱、电话或公司" />

          <div class="flex justify-end">
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
            <UCard class="sm:max-w-2xl">
              <template #header>
                <div>
                  <p class="text-base font-semibold text-highlighted">
                    {{ modalTitle }}
                  </p>
                  <p class="text-sm text-muted">
                    客户主档会直接影响商机归属和订单记录。
                  </p>
                </div>
              </template>

              <UForm :schema="customerSchema" :state="customerForm" class="space-y-4" @submit="submitCustomer">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="name" label="客户名称" required>
                    <UInput v-model="customerForm.name" :disabled="isReadonly" placeholder="请输入客户名称" />
                  </UFormField>

                  <UFormField name="company" label="所属公司" required>
                    <UInput v-model="customerForm.company" :disabled="isReadonly" placeholder="请输入公司名称" />
                  </UFormField>

                  <UFormField name="email" label="邮箱" required>
                    <UInput v-model="customerForm.email" :disabled="isReadonly" placeholder="例如 crm@example.com" />
                  </UFormField>

                  <UFormField name="phone" label="联系电话" required>
                    <UInput v-model="customerForm.phone" :disabled="isReadonly" placeholder="请输入联系电话" />
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
