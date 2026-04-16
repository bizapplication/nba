<script setup lang="ts">
import { z } from 'zod'

import type { Department, DepartmentFormState, DepartmentStatus } from '~/types/hr'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { departmentStatusOptions, hrStatusColor } from '~/utils/hr'

const api = useHrApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Department[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<DepartmentStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)

const statusItems = toSelectItems(departmentStatusOptions)

const departmentSchema = z.object({
  departmentCode: z.string().min(1, '请输入部门编码'),
  departmentName: z.string().min(1, '请输入部门名称'),
  status: z.enum(['active', 'inactive']),
  description: z.string().optional()
})

const departmentForm = reactive<DepartmentFormState>(createDepartmentForm())

const columns = [
  { accessorKey: 'departmentCode', header: '部门编码' },
  { accessorKey: 'departmentName', header: '部门名称' },
  { accessorKey: 'employeeCount', header: '员工数' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

function createDepartmentForm(): DepartmentFormState {
  return {
    departmentCode: '',
    departmentName: '',
    status: 'active',
    description: ''
  }
}

function assignForm(department: Department) {
  Object.assign(departmentForm, {
    departmentCode: department.departmentCode,
    departmentName: department.departmentName,
    status: department.status,
    description: department.description || ''
  })
}

async function loadDepartments() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listDepartments({
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
  Object.assign(departmentForm, createDepartmentForm())
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(department: Department) {
  formMode.value = 'edit'
  editingId.value = department.id
  assignForm(department)
  open.value = true
}

function openViewModal(department: Department) {
  formMode.value = 'view'
  editingId.value = department.id
  assignForm(department)
  open.value = true
}

async function submitDepartment() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateDepartment(editingId.value, departmentForm)
      toast.add({ title: '部门已更新', color: 'success' })
    } else {
      await api.createDepartment(departmentForm)
      toast.add({ title: '部门已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadDepartments()
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

async function removeDepartment(department: Department) {
  if (!window.confirm(`确认删除部门“${department.departmentName}”吗？`)) {
    return
  }

  try {
    await api.deleteDepartment(department.id)
    toast.add({ title: '部门已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadDepartments()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(department: Department): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(department)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(department)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeDepartment(department)
      }
    }
  ]]
}

watch(page, () => {
  void loadDepartments()
})

watch(statusFilter, () => {
  page.value = 1
  void loadDepartments()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadDepartments()
  }, 250)
})

onMounted(() => {
  void loadDepartments()
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
              部门管理
            </p>
            <p class="text-sm text-muted">
              维护 HR 部门主数据与状态
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增部门
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索部门名称、编码或描述" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
              class="min-w-36"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadDepartments">
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
              正在加载部门列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #status-cell="{ row }">
                <UBadge :color="hrStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(departmentStatusOptions, row.original.status) }}
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
                    {{ formMode === 'view' ? '部门详情' : formMode === 'edit' ? '编辑部门' : '新增部门' }}
                  </p>
                  <p class="text-sm text-muted">
                    部门是员工任职关系和报销归属的基础主数据。
                  </p>
                </div>
              </template>

              <UForm :schema="departmentSchema" :state="departmentForm" class="space-y-4" @submit="submitDepartment">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="departmentCode" label="部门编码" required>
                    <UInput v-model="departmentForm.departmentCode" :disabled="isReadonly" placeholder="如 DEPT-0003" />
                  </UFormField>

                  <UFormField name="departmentName" label="部门名称" required>
                    <UInput v-model="departmentForm.departmentName" :disabled="isReadonly" placeholder="请输入部门名称" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="departmentForm.status"
                      :items="departmentStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="description" label="描述" class="lg:col-span-2">
                    <UTextarea
                      v-model="departmentForm.description"
                      :rows="4"
                      :disabled="isReadonly"
                      placeholder="补充部门职责或说明"
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
