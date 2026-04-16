<script setup lang="ts">
import { z } from 'zod'

import type { Department, Employee, Employment, EmploymentFormState, EmploymentStatus, Position } from '~/types/hr'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatDate,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { employmentStatusOptions, hrStatusColor } from '~/utils/hr'

const api = useHrApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Employment[]>([])
const employeeOptions = ref<Employee[]>([])
const departmentOptions = ref<Department[]>([])
const positionOptions = ref<Position[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<EmploymentStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const employeeFilter = ref(FILTER_ALL_VALUE)
const departmentFilter = ref(FILTER_ALL_VALUE)
const positionFilter = ref(FILTER_ALL_VALUE)

const statusItems = toSelectItems(employmentStatusOptions)

const employmentSchema = z.object({
  employeeId: z.string().min(1, '请选择员工'),
  departmentId: z.string().min(1, '请选择部门'),
  positionId: z.string().min(1, '请选择岗位'),
  entryDate: z.string().min(1, '请选择入职日期'),
  status: z.enum(['active', 'inactive']),
  isPrimary: z.boolean()
})

const employmentForm = reactive<EmploymentFormState>(createEmploymentForm())

const columns = [
  { accessorKey: 'employeeName', header: '员工' },
  { accessorKey: 'departmentName', header: '部门' },
  { accessorKey: 'positionName', header: '岗位' },
  { accessorKey: 'entryDate', header: '入职日期' },
  { accessorKey: 'isPrimary', header: '主任职' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

const employeeFilterItems = computed(() => [
  { label: '全部员工', value: FILTER_ALL_VALUE },
  ...employeeOptions.value.map((employee) => ({
    label: `${employee.employeeName} / ${employee.employeeCode}`,
    value: employee.id
  }))
])

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

const employeeFormItems = computed(() => employeeOptions.value.map((employee) => ({
  label: `${employee.employeeName} / ${employee.employeeCode}`,
  value: employee.id
})))

const departmentFormItems = computed(() => departmentOptions.value.map((department) => ({
  label: `${department.departmentName} / ${department.departmentCode}`,
  value: department.id
})))

const positionFormItems = computed(() => positionOptions.value.map((position) => ({
  label: `${position.positionName} / ${position.positionCode}`,
  value: position.id
})))

function createEmploymentForm(): EmploymentFormState {
  return {
    employeeId: '',
    departmentId: '',
    positionId: '',
    entryDate: new Date().toISOString().slice(0, 10),
    status: 'active',
    isPrimary: true
  }
}

function assignForm(employment: Employment) {
  Object.assign(employmentForm, {
    employeeId: employment.employeeId,
    departmentId: employment.departmentId,
    positionId: employment.positionId,
    entryDate: employment.entryDate,
    status: employment.status,
    isPrimary: employment.isPrimary
  })
}

async function loadReferences() {
  const [employees, departments, positions] = await Promise.all([
    api.listEmployees({ page: 1, limit: 200 }),
    api.listDepartments({ page: 1, limit: 200 }),
    api.listPositions({ page: 1, limit: 200 })
  ])

  employeeOptions.value = employees.data
  departmentOptions.value = departments.data
  positionOptions.value = positions.data
}

async function loadEmployments() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listEmployments({
      page: page.value,
      limit,
      search: search.value || undefined,
      employeeId: normalizeFilterValue(employeeFilter.value),
      departmentId: normalizeFilterValue(departmentFilter.value),
      positionId: normalizeFilterValue(positionFilter.value),
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
  Object.assign(employmentForm, createEmploymentForm())

  if (employeeOptions.value[0]) {
    employmentForm.employeeId = employeeOptions.value[0].id
  }

  if (departmentOptions.value[0]) {
    employmentForm.departmentId = departmentOptions.value[0].id
  }

  if (positionOptions.value[0]) {
    employmentForm.positionId = positionOptions.value[0].id
  }
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(employment: Employment) {
  formMode.value = 'edit'
  editingId.value = employment.id
  assignForm(employment)
  open.value = true
}

function openViewModal(employment: Employment) {
  formMode.value = 'view'
  editingId.value = employment.id
  assignForm(employment)
  open.value = true
}

async function submitEmployment() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateEmployment(editingId.value, employmentForm)
      toast.add({ title: '任职关系已更新', color: 'success' })
    } else {
      await api.createEmployment(employmentForm)
      toast.add({ title: '任职关系已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadEmployments()
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

async function removeEmployment(employment: Employment) {
  if (!window.confirm(`确认删除任职关系“${employment.employeeName || '-'} / ${employment.departmentName || '-'}”吗？`)) {
    return
  }

  try {
    await api.deleteEmployment(employment.id)
    toast.add({ title: '任职关系已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadEmployments()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(employment: Employment): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(employment)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(employment)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removeEmployment(employment)
      }
    }
  ]]
}

watch(page, () => {
  void loadEmployments()
})

watch([statusFilter, employeeFilter, departmentFilter, positionFilter], () => {
  page.value = 1
  void loadEmployments()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadEmployments()
  }, 250)
})

onMounted(async () => {
  await loadReferences()
  await loadEmployments()
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
              任职关系
            </p>
            <p class="text-sm text-muted">
              维护员工与部门、岗位之间的任职映射
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增任职
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索员工、部门或岗位" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="employeeFilter"
              :items="employeeFilterItems"
              value-key="value"
              label-key="label"
              placeholder="员工"
              class="min-w-56"
            />
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
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadEmployments">
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
              正在加载任职关系列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #entryDate-cell="{ row }">
                {{ formatDate(row.original.entryDate) }}
              </template>

              <template #isPrimary-cell="{ row }">
                <UBadge :color="row.original.isPrimary ? 'primary' : 'neutral'" variant="subtle">
                  {{ row.original.isPrimary ? '是' : '否' }}
                </UBadge>
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="hrStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(employmentStatusOptions, row.original.status) }}
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
            <UCard class="sm:max-w-3xl">
              <template #header>
                <div>
                  <p class="text-base font-semibold text-highlighted">
                    {{ formMode === 'view' ? '任职详情' : formMode === 'edit' ? '编辑任职' : '新增任职' }}
                  </p>
                  <p class="text-sm text-muted">
                    任职关系是员工与组织结构之间的独立关系对象，不直接拍平到所有业务单据中。
                  </p>
                </div>
              </template>

              <UForm :schema="employmentSchema" :state="employmentForm" class="space-y-4" @submit="submitEmployment">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="employeeId" label="员工" required>
                    <USelect
                      v-model="employmentForm.employeeId"
                      :items="employeeFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                      placeholder="请选择员工"
                    />
                  </UFormField>

                  <UFormField name="departmentId" label="部门" required>
                    <USelect
                      v-model="employmentForm.departmentId"
                      :items="departmentFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                      placeholder="请选择部门"
                    />
                  </UFormField>

                  <UFormField name="positionId" label="岗位" required>
                    <USelect
                      v-model="employmentForm.positionId"
                      :items="positionFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                      placeholder="请选择岗位"
                    />
                  </UFormField>

                  <UFormField name="entryDate" label="入职日期" required>
                    <UInput v-model="employmentForm.entryDate" type="date" :disabled="isReadonly" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="employmentForm.status"
                      :items="employmentStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="isPrimary" label="主任职">
                    <UCheckbox v-model="employmentForm.isPrimary" :disabled="isReadonly" label="设为员工当前主任职" />
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
