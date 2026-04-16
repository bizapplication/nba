<script setup lang="ts">
import { z } from 'zod'

import type { Employee, EmployeeFormState, EmployeeStatus, Department, Position } from '~/types/hr'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatDate,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { employeeStatusOptions, hrStatusColor } from '~/utils/hr'

const api = useHrApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Employee[]>([])
const departmentOptions = ref<Department[]>([])
const positionOptions = ref<Position[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<EmployeeStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const departmentFilter = ref(FILTER_ALL_VALUE)
const positionFilter = ref(FILTER_ALL_VALUE)

const statusItems = toSelectItems(employeeStatusOptions)

const employeeSchema = z.object({
  employeeCode: z.string().min(1, '请输入员工编码'),
  employeeName: z.string().min(1, '请输入员工姓名'),
  status: z.enum(['active', 'inactive']),
  defaultCurrency: z.string().min(3, '请输入默认币种'),
  description: z.string().optional()
})

const employeeForm = reactive<EmployeeFormState>(createEmployeeForm())

const columns = [
  { accessorKey: 'employeeCode', header: '员工编码' },
  { accessorKey: 'employeeName', header: '员工姓名' },
  { accessorKey: 'departmentName', header: '主部门' },
  { accessorKey: 'positionName', header: '主岗位' },
  { accessorKey: 'entryDate', header: '入职日期' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const departmentFilterItems = computed(() => [
  { label: '全部部门', value: FILTER_ALL_VALUE },
  ...departmentOptions.value.map((department) => ({
    label: `${department.departmentName} / ${department.departmentCode}`,
    value: department.id
  }))
])

const positionFilterItems = computed(() => [
  { label: '全部岗位', value: FILTER_ALL_VALUE },
  ...positionOptions.value.map((position) => ({
    label: `${position.positionName} / ${position.positionCode}`,
    value: position.id
  }))
])

function createEmployeeForm(): EmployeeFormState {
  return {
    employeeCode: '',
    employeeName: '',
    status: 'active',
    defaultCurrency: 'CNY',
    description: ''
  }
}

function assignForm(employee: Employee) {
  Object.assign(employeeForm, {
    employeeCode: employee.employeeCode,
    employeeName: employee.employeeName,
    status: employee.status,
    defaultCurrency: employee.defaultCurrency,
    description: employee.description || ''
  })
}

async function loadReferences() {
  const [departments, positions] = await Promise.all([
    api.listDepartments({ page: 1, limit: 200 }),
    api.listPositions({ page: 1, limit: 200 })
  ])

  departmentOptions.value = departments.data
  positionOptions.value = positions.data
}

async function loadEmployees() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listEmployees({
      page: page.value,
      limit,
      search: search.value || undefined,
      status: normalizeFilterValue(statusFilter.value),
      departmentId: normalizeFilterValue(departmentFilter.value),
      positionId: normalizeFilterValue(positionFilter.value)
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
  Object.assign(employeeForm, createEmployeeForm())
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(employee: Employee) {
  formMode.value = 'edit'
  editingId.value = employee.id
  assignForm(employee)
  open.value = true
}

function openViewModal(employee: Employee) {
  formMode.value = 'view'
  editingId.value = employee.id
  assignForm(employee)
  open.value = true
}

async function submitEmployee() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateEmployee(editingId.value, employeeForm)
      toast.add({ title: '员工已更新', color: 'success' })
    } else {
      await api.createEmployee(employeeForm)
      toast.add({ title: '员工已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadEmployees()
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

async function removeEmployee(employee: Employee) {
  if (!window.confirm(`确认删除员工“${employee.employeeName}”吗？`)) {
    return
  }

  try {
    await api.deleteEmployee(employee.id)
    toast.add({ title: '员工已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadEmployees()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(employee: Employee): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(employee)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(employee)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeEmployee(employee)
      }
    }
  ]]
}

watch(page, () => {
  void loadEmployees()
})

watch([statusFilter, departmentFilter, positionFilter], () => {
  page.value = 1
  void loadEmployees()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadEmployees()
  }, 250)
})

onMounted(async () => {
  await loadReferences()
  await loadEmployees()
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
              员工管理
            </p>
            <p class="text-sm text-muted">
              维护员工主数据、主任职信息与状态
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增员工
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索员工姓名、编码或描述" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="departmentFilter"
              :items="departmentFilterItems"
              value-key="value"
              label-key="label"
              placeholder="部门"
              class="min-w-56"
            />
            <USelect
              v-model="positionFilter"
              :items="positionFilterItems"
              value-key="value"
              label-key="label"
              placeholder="岗位"
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
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadEmployees">
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
              正在加载员工列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #departmentName-cell="{ row }">
                {{ row.original.departmentName || '-' }}
              </template>

              <template #positionName-cell="{ row }">
                {{ row.original.positionName || '-' }}
              </template>

              <template #entryDate-cell="{ row }">
                {{ formatDate(row.original.entryDate) }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="hrStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(employeeStatusOptions, row.original.status) }}
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
                    {{ formMode === 'view' ? '员工详情' : formMode === 'edit' ? '编辑员工' : '新增员工' }}
                  </p>
                  <p class="text-sm text-muted">
                    员工主数据与任职关系分离维护，页面中展示的是当前主任职视图。
                  </p>
                </div>
              </template>

              <UForm :schema="employeeSchema" :state="employeeForm" class="space-y-4" @submit="submitEmployee">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="employeeCode" label="员工编码" required>
                    <UInput v-model="employeeForm.employeeCode" :disabled="isReadonly" placeholder="如 EMP-0003" />
                  </UFormField>

                  <UFormField name="employeeName" label="员工姓名" required>
                    <UInput v-model="employeeForm.employeeName" :disabled="isReadonly" placeholder="请输入员工姓名" />
                  </UFormField>

                  <UFormField name="defaultCurrency" label="默认币种" required>
                    <UInput v-model="employeeForm.defaultCurrency" :disabled="isReadonly" placeholder="如 CNY" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="employeeForm.status"
                      :items="employeeStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="description" label="描述" class="lg:col-span-2">
                    <UTextarea
                      v-model="employeeForm.description"
                      :rows="4"
                      :disabled="isReadonly"
                      placeholder="补充员工说明或标签"
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
