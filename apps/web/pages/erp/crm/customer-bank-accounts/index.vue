<script setup lang="ts">
import { z } from 'zod'

import type { LifecycleStatus, SelectOption } from '~/types/finance'
import type {
  Customer,
  CustomerBankAccount,
  CustomerBankAccountFormState
} from '~/types/crm'
import {
  FILTER_ALL_VALUE,
  createOptionalSelectItem,
  findOptionLabel,
  formatDateTime,
  lifecycleStatusOptions,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { crmStatusColor } from '~/utils/crm'

const api = useCrmApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<CustomerBankAccount[]>([])
const customerOptions = ref<Customer[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<LifecycleStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const customerFilter = ref(FILTER_ALL_VALUE)

const statusItems = toSelectItems(lifecycleStatusOptions)

const customerBankAccountSchema = z.object({
  customerId: z.string().min(1, '请选择客户'),
  bankName: z.string().min(1, '请输入开户行'),
  accountName: z.string().min(1, '请输入户名'),
  accountNo: z.string().min(1, '请输入账号'),
  currency: z.string().min(3, '请输入币种'),
  isDefault: z.boolean(),
  status: z.enum(['active', 'inactive'])
})

const customerBankAccountForm = reactive<CustomerBankAccountFormState>(createCustomerBankAccountForm())

const columns = [
  { accessorKey: 'customerName', header: '客户' },
  { accessorKey: 'bankName', header: '开户行' },
  { accessorKey: 'accountName', header: '户名' },
  { accessorKey: 'accountNo', header: '账号' },
  { accessorKey: 'currency', header: '币种' },
  { accessorKey: 'isDefault', header: '默认账户' },
  { accessorKey: 'status', header: '状态' },
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

const customerFormItems = computed(() => [
  createOptionalSelectItem('请选择客户'),
  ...customerOptions.value.map((customer) => ({
    label: `${customer.customerName} / ${customer.customerCode}`,
    value: customer.id
  }))
])

function createCustomerBankAccountForm(): CustomerBankAccountFormState {
  return {
    customerId: '',
    bankName: '',
    accountName: '',
    accountNo: '',
    currency: 'CNY',
    isDefault: true,
    status: 'active'
  }
}

function assignForm(bankAccount: CustomerBankAccount) {
  Object.assign(customerBankAccountForm, {
    customerId: bankAccount.customerId,
    bankName: bankAccount.bankName,
    accountName: bankAccount.accountName,
    accountNo: bankAccount.accountNo,
    currency: bankAccount.currency,
    isDefault: bankAccount.isDefault,
    status: bankAccount.status
  })
}

async function loadReferences() {
  const result = await api.listCustomers({ page: 1, limit: 100 })
  customerOptions.value = result.data
}

async function loadCustomerBankAccounts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listCustomerBankAccounts({
      page: page.value,
      limit,
      search: search.value || undefined,
      customerId: normalizeFilterValue(customerFilter.value),
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
  Object.assign(customerBankAccountForm, createCustomerBankAccountForm())
  const firstCustomer = customerOptions.value[0]
  if (firstCustomer) {
    customerBankAccountForm.customerId = firstCustomer.id
  }
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(bankAccount: CustomerBankAccount) {
  formMode.value = 'edit'
  editingId.value = bankAccount.id
  assignForm(bankAccount)
  open.value = true
}

function openViewModal(bankAccount: CustomerBankAccount) {
  formMode.value = 'view'
  editingId.value = bankAccount.id
  assignForm(bankAccount)
  open.value = true
}

async function submitCustomerBankAccount() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateCustomerBankAccount(editingId.value, customerBankAccountForm)
      toast.add({ title: '客户收款账户已更新', color: 'success' })
    } else {
      await api.createCustomerBankAccount(customerBankAccountForm)
      toast.add({ title: '客户收款账户已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadCustomerBankAccounts()
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

async function removeCustomerBankAccount(bankAccount: CustomerBankAccount) {
  if (!window.confirm(`确认删除账户“${bankAccount.accountName} / ${bankAccount.accountNo}”吗？`)) {
    return
  }

  try {
    await api.deleteCustomerBankAccount(bankAccount.id)
    toast.add({ title: '客户收款账户已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadCustomerBankAccounts()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(bankAccount: CustomerBankAccount): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(bankAccount)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(bankAccount)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeCustomerBankAccount(bankAccount)
      }
    }
  ]]
}

watch(page, () => {
  void loadCustomerBankAccounts()
})

watch([statusFilter, customerFilter], () => {
  page.value = 1
  void loadCustomerBankAccounts()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadCustomerBankAccounts()
  }, 250)
})

onMounted(async () => {
  await loadReferences()
  await loadCustomerBankAccounts()
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
              客户收款账户
            </p>
            <p class="text-sm text-muted">
              维护客户付款账户、开户行与默认账户
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增账户
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索客户、开户行、户名或账号" />

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
              class="min-w-36"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadCustomerBankAccounts">
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
              正在加载客户收款账户...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #customerName-cell="{ row }">
                {{ row.original.customerName || '-' }}
              </template>

              <template #isDefault-cell="{ row }">
                <UBadge :color="row.original.isDefault ? 'success' : 'neutral'" variant="subtle">
                  {{ row.original.isDefault ? '默认' : '普通' }}
                </UBadge>
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="crmStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(lifecycleStatusOptions as SelectOption<LifecycleStatus>[], row.original.status) }}
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
                    {{
                      formMode === 'view'
                        ? '客户收款账户详情'
                        : formMode === 'edit'
                          ? '编辑客户收款账户'
                          : '新增客户收款账户'
                    }}
                  </p>
                  <p class="text-sm text-muted">
                    客户收款账户用于承接收款单来源账户信息。
                  </p>
                </div>
              </template>

              <UForm :schema="customerBankAccountSchema" :state="customerBankAccountForm" class="space-y-4" @submit="submitCustomerBankAccount">
                <div class="grid gap-4 md:grid-cols-2">
                  <UFormField label="客户" name="customerId">
                    <USelect
                      v-model="customerBankAccountForm.customerId"
                      :items="customerFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>
                  <UFormField label="开户行" name="bankName">
                    <UInput v-model="customerBankAccountForm.bankName" :disabled="isReadonly" placeholder="请输入开户行" />
                  </UFormField>
                  <UFormField label="户名" name="accountName">
                    <UInput v-model="customerBankAccountForm.accountName" :disabled="isReadonly" placeholder="请输入户名" />
                  </UFormField>
                  <UFormField label="账号" name="accountNo">
                    <UInput v-model="customerBankAccountForm.accountNo" :disabled="isReadonly" placeholder="请输入账号" />
                  </UFormField>
                  <UFormField label="币种" name="currency">
                    <UInput v-model="customerBankAccountForm.currency" :disabled="isReadonly" placeholder="如 CNY" />
                  </UFormField>
                  <UFormField label="状态" name="status">
                    <USelect
                      v-model="customerBankAccountForm.status"
                      :items="lifecycleStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>
                </div>

                <UFormField label="默认账户" name="isDefault">
                  <USwitch v-model="customerBankAccountForm.isDefault" :disabled="isReadonly" />
                </UFormField>

                <div v-if="!isReadonly" class="flex justify-end gap-3">
                  <UButton color="neutral" variant="ghost" @click="open = false">
                    取消
                  </UButton>
                  <UButton type="submit" color="primary" :loading="submitting">
                    {{ formMode === 'edit' ? '保存更新' : '创建账户' }}
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
