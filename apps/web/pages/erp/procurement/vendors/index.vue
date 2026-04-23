<script setup lang="ts">
import { z } from 'zod'

import type { Vendor, VendorFormState, VendorStatus } from '~/types/procurement'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { procurementStatusColor, vendorStatusOptions } from '~/utils/procurement'

const api = useProcurementApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Vendor[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<VendorStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)

const statusItems = toSelectItems(vendorStatusOptions)

const vendorSchema = z.object({
  vendorCode: z.string().min(1, '请输入供应商编码'),
  vendorName: z.string().min(1, '请输入供应商名称'),
  shortName: z.string().min(1, '请输入供应商简称'),
  status: z.enum(['active', 'inactive']),
  defaultCurrency: z.string().min(3, '请输入默认币种'),
  description: z.string().optional()
})

const vendorForm = reactive<VendorFormState>(createVendorForm())

const columns = [
  { accessorKey: 'vendorCode', header: '供应商编码' },
  { accessorKey: 'vendorName', header: '供应商名称' },
  { accessorKey: 'shortName', header: '简称' },
  { accessorKey: 'defaultBankAccountName', header: '默认收款账户' },
  { accessorKey: 'bankAccountCount', header: '账户数' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const modalTitle = computed(() => {
  if (formMode.value === 'view') {
    return '供应商详情'
  }

  if (formMode.value === 'edit') {
    return '编辑供应商'
  }

  return '新增供应商'
})

function createVendorForm(): VendorFormState {
  return {
    vendorCode: '',
    vendorName: '',
    shortName: '',
    status: 'active',
    defaultCurrency: 'CNY',
    description: ''
  }
}

function assignForm(vendor: Vendor) {
  Object.assign(vendorForm, {
    vendorCode: vendor.vendorCode,
    vendorName: vendor.vendorName,
    shortName: vendor.shortName,
    status: vendor.status,
    defaultCurrency: vendor.defaultCurrency,
    description: vendor.description || ''
  })
}

async function loadVendors() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listVendors({
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
  Object.assign(vendorForm, createVendorForm())
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(vendor: Vendor) {
  formMode.value = 'edit'
  editingId.value = vendor.id
  assignForm(vendor)
  open.value = true
}

function openViewModal(vendor: Vendor) {
  formMode.value = 'view'
  editingId.value = vendor.id
  assignForm(vendor)
  open.value = true
}

async function submitVendor() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateVendor(editingId.value, vendorForm)
      toast.add({ title: '供应商已更新', color: 'success' })
    } else {
      await api.createVendor(vendorForm)
      toast.add({ title: '供应商已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadVendors()
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

async function removeVendor(vendor: Vendor) {
  if (!window.confirm(`确认删除供应商“${vendor.vendorName}”吗？`)) {
    return
  }

  try {
    await api.deleteVendor(vendor.id)
    toast.add({ title: '供应商已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadVendors()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(vendor: Vendor): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(vendor)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(vendor)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeVendor(vendor)
      }
    }
  ]]
}

watch(page, () => {
  void loadVendors()
})

watch(statusFilter, () => {
  page.value = 1
  void loadVendors()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadVendors()
  }, 250)
})

onMounted(() => {
  void loadVendors()
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
              供应商管理
            </p>
            <p class="text-sm text-muted">
              维护供应商主数据、默认币种与启停状态
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增供应商
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索供应商名称、编码或简称" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
              class="min-w-36"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadVendors">
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
              正在加载供应商列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #defaultBankAccountName-cell="{ row }">
                {{ row.original.defaultBankAccountName || '-' }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="procurementStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(vendorStatusOptions, row.original.status) }}
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
                    供应商主数据用于承接后续付款单、采购单等业务单据。
                  </p>
                </div>
              </template>

              <UForm :schema="vendorSchema" :state="vendorForm" class="space-y-4" @submit="submitVendor">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="vendorCode" label="供应商编码" required>
                    <UInput v-model="vendorForm.vendorCode" :disabled="isReadonly" placeholder="如 VEND-0003" />
                  </UFormField>

                  <UFormField name="vendorName" label="供应商名称" required>
                    <UInput v-model="vendorForm.vendorName" :disabled="isReadonly" placeholder="请输入供应商名称" />
                  </UFormField>

                  <UFormField name="shortName" label="简称" required>
                    <UInput v-model="vendorForm.shortName" :disabled="isReadonly" placeholder="请输入简称" />
                  </UFormField>

                  <UFormField name="defaultCurrency" label="默认币种" required>
                    <UInput v-model="vendorForm.defaultCurrency" :disabled="isReadonly" placeholder="如 CNY" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="vendorForm.status"
                      :items="vendorStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="description" label="描述" class="lg:col-span-2">
                    <UTextarea
                      v-model="vendorForm.description"
                      :rows="4"
                      :disabled="isReadonly"
                      placeholder="补充供应商背景或合作说明"
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
