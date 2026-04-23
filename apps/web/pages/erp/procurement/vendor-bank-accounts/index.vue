<script setup lang="ts">
import { z } from 'zod'

import type { LifecycleStatus, SelectOption } from '~/types/finance'
import type {
  Vendor,
  VendorBankAccount,
  VendorBankAccountFormState
} from '~/types/procurement'
import {
  FILTER_ALL_VALUE,
  asOptionalSelectValue,
  createOptionalSelectItem,
  findOptionLabel,
  formatDateTime,
  fromOptionalSelectValue,
  lifecycleStatusOptions,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { procurementStatusColor } from '~/utils/procurement'

const api = useProcurementApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<VendorBankAccount[]>([])
const vendorOptions = ref<Vendor[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<LifecycleStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const vendorFilter = ref(FILTER_ALL_VALUE)

const statusItems = toSelectItems(lifecycleStatusOptions)

const vendorBankAccountSchema = z.object({
  vendorId: z.string().min(1, '请选择供应商'),
  bankName: z.string().min(1, '请输入开户行'),
  accountName: z.string().min(1, '请输入户名'),
  accountNo: z.string().min(1, '请输入账号'),
  currency: z.string().min(3, '请输入币种'),
  isDefault: z.boolean(),
  status: z.enum(['active', 'inactive'])
})

const vendorBankAccountForm = reactive<VendorBankAccountFormState>(createVendorBankAccountForm())

const columns = [
  { accessorKey: 'vendorName', header: '供应商' },
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

const vendorFilterItems = computed(() => [
  { label: '全部供应商', value: FILTER_ALL_VALUE },
  ...vendorOptions.value.map((vendor) => ({
    label: `${vendor.vendorName} / ${vendor.vendorCode}`,
    value: vendor.id
  }))
])

const vendorFormItems = computed(() => [
  createOptionalSelectItem('请选择供应商'),
  ...vendorOptions.value.map((vendor) => ({
    label: `${vendor.vendorName} / ${vendor.vendorCode}`,
    value: vendor.id
  }))
])

function createVendorBankAccountForm(): VendorBankAccountFormState {
  return {
    vendorId: '',
    bankName: '',
    accountName: '',
    accountNo: '',
    currency: 'CNY',
    isDefault: true,
    status: 'active'
  }
}

function assignForm(bankAccount: VendorBankAccount) {
  Object.assign(vendorBankAccountForm, {
    vendorId: bankAccount.vendorId,
    bankName: bankAccount.bankName,
    accountName: bankAccount.accountName,
    accountNo: bankAccount.accountNo,
    currency: bankAccount.currency,
    isDefault: bankAccount.isDefault,
    status: bankAccount.status
  })
}

async function loadReferences() {
  const result = await api.listVendors({ page: 1, limit: 100 })
  vendorOptions.value = result.data
}

async function loadVendorBankAccounts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listVendorBankAccounts({
      page: page.value,
      limit,
      search: search.value || undefined,
      vendorId: normalizeFilterValue(vendorFilter.value),
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
  Object.assign(vendorBankAccountForm, createVendorBankAccountForm())
  const firstVendor = vendorOptions.value[0]
  if (firstVendor) {
    vendorBankAccountForm.vendorId = firstVendor.id
  }
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(bankAccount: VendorBankAccount) {
  formMode.value = 'edit'
  editingId.value = bankAccount.id
  assignForm(bankAccount)
  open.value = true
}

function openViewModal(bankAccount: VendorBankAccount) {
  formMode.value = 'view'
  editingId.value = bankAccount.id
  assignForm(bankAccount)
  open.value = true
}

async function submitVendorBankAccount() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateVendorBankAccount(editingId.value, vendorBankAccountForm)
      toast.add({ title: '供应商银行信息已更新', color: 'success' })
    } else {
      await api.createVendorBankAccount(vendorBankAccountForm)
      toast.add({ title: '供应商银行信息已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadVendorBankAccounts()
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

async function removeVendorBankAccount(bankAccount: VendorBankAccount) {
  if (!window.confirm(`确认删除账户“${bankAccount.accountName} / ${bankAccount.accountNo}”吗？`)) {
    return
  }

  try {
    await api.deleteVendorBankAccount(bankAccount.id)
    toast.add({ title: '供应商银行信息已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadVendorBankAccounts()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(bankAccount: VendorBankAccount): any {
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
        void removeVendorBankAccount(bankAccount)
      }
    }
  ]]
}

watch(page, () => {
  void loadVendorBankAccounts()
})

watch([statusFilter, vendorFilter], () => {
  page.value = 1
  void loadVendorBankAccounts()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadVendorBankAccounts()
  }, 250)
})

onMounted(async () => {
  await loadReferences()
  await loadVendorBankAccounts()
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
              供应商银行信息
            </p>
            <p class="text-sm text-muted">
              维护供应商收款账户、开户行与默认账户
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
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索供应商、开户行、户名或账号" />

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
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
              class="min-w-36"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadVendorBankAccounts">
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
              正在加载供应商银行信息...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #vendorName-cell="{ row }">
                {{ row.original.vendorName || '-' }}
              </template>

              <template #isDefault-cell="{ row }">
                <UBadge :color="row.original.isDefault ? 'success' : 'neutral'" variant="subtle">
                  {{ row.original.isDefault ? '默认' : '普通' }}
                </UBadge>
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="procurementStatusColor(row.original.status)" variant="subtle">
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
                    {{ formMode === 'view' ? '银行账户详情' : formMode === 'edit' ? '编辑银行账户' : '新增银行账户' }}
                  </p>
                  <p class="text-sm text-muted">
                    供应商可以维护多个收款账户，付款单会优先引用默认账户。
                  </p>
                </div>
              </template>

              <UForm :schema="vendorBankAccountSchema" :state="vendorBankAccountForm" class="space-y-4" @submit="submitVendorBankAccount">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="vendorId" label="供应商" required>
                    <USelect
                      v-model="vendorBankAccountForm.vendorId"
                      :items="vendorFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="currency" label="币种" required>
                    <UInput v-model="vendorBankAccountForm.currency" :disabled="isReadonly" placeholder="如 CNY" />
                  </UFormField>

                  <UFormField name="bankName" label="开户行" required>
                    <UInput v-model="vendorBankAccountForm.bankName" :disabled="isReadonly" placeholder="请输入开户行" />
                  </UFormField>

                  <UFormField name="accountName" label="户名" required>
                    <UInput v-model="vendorBankAccountForm.accountName" :disabled="isReadonly" placeholder="请输入户名" />
                  </UFormField>

                  <UFormField name="accountNo" label="账号" required class="lg:col-span-2">
                    <UInput v-model="vendorBankAccountForm.accountNo" :disabled="isReadonly" placeholder="请输入收款账号" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="vendorBankAccountForm.status"
                      :items="lifecycleStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="isDefault" label="默认账户">
                    <div class="flex h-10 items-center">
                      <USwitch v-model="vendorBankAccountForm.isDefault" :disabled="isReadonly" />
                    </div>
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
