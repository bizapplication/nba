<script setup lang="ts">
import { z } from 'zod'

import type { SelectOption, TransactionStatus } from '~/types/finance'
import type {
  Department,
  Employee,
  ExpenseClaim,
  ExpenseClaimFormState,
  ExpenseClaimStatus
} from '~/types/hr'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  normalizeFilterValue,
  statusColor,
  toSelectItems,
  transactionStatusOptions
} from '~/utils/finance'
import { expenseClaimStatusOptions, hrStatusColor } from '~/utils/hr'

const api = useHrApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<ExpenseClaim[]>([])
const employeeOptions = ref<Employee[]>([])
const departmentOptions = ref<Department[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<ExpenseClaimStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)
const employeeFilter = ref(FILTER_ALL_VALUE)
const departmentFilter = ref(FILTER_ALL_VALUE)
const dateFrom = ref('')
const dateTo = ref('')

const statusItems = toSelectItems(expenseClaimStatusOptions)

const expenseClaimSchema = z.object({
  expenseClaimNo: z.string().optional(),
  employeeId: z.string().min(1, '请选择员工'),
  departmentId: z.string().min(1, '请选择部门'),
  amount: z.number().positive('请输入大于 0 的金额'),
  currency: z.string().min(3, '请输入币种'),
  claimDate: z.string().min(1, '请选择报销日期'),
  purpose: z.string().min(1, '请输入报销用途'),
  referenceNo: z.string().optional(),
  description: z.string().optional()
})

const expenseClaimForm = reactive<ExpenseClaimFormState>(createExpenseClaimForm())

const columns = [
  { accessorKey: 'expenseClaimNo', header: '报销单号' },
  { accessorKey: 'employeeName', header: '员工' },
  { accessorKey: 'departmentName', header: '归属部门' },
  { accessorKey: 'amount', header: '金额' },
  { accessorKey: 'claimDate', header: '报销日期' },
  { accessorKey: 'status', header: '业务状态' },
  { accessorKey: 'paymentStatus', header: '付款状态' },
  { accessorKey: 'transactionCode', header: '财务交易' },
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

const employeeFormItems = computed(() => employeeOptions.value.map((employee) => ({
  label: `${employee.employeeName} / ${employee.employeeCode}`,
  value: employee.id
})))

const departmentFormItems = computed(() => departmentOptions.value.map((department) => ({
  label: `${department.departmentName} / ${department.departmentCode}`,
  value: department.id
})))

const dateRangeError = computed(() => {
  if (!dateFrom.value || !dateTo.value) {
    return ''
  }

  if (dateFrom.value > dateTo.value) {
    return '开始日期不能晚于结束日期，请先修正日期范围。'
  }

  return ''
})

function createExpenseClaimForm(): ExpenseClaimFormState {
  return {
    expenseClaimNo: '',
    employeeId: '',
    departmentId: '',
    amount: undefined,
    currency: 'CNY',
    claimDate: new Date().toISOString().slice(0, 10),
    purpose: '',
    referenceNo: '',
    description: ''
  }
}

function assignForm(expenseClaim: ExpenseClaim) {
  Object.assign(expenseClaimForm, {
    expenseClaimNo: expenseClaim.expenseClaimNo,
    employeeId: expenseClaim.employeeId,
    departmentId: expenseClaim.departmentId,
    amount: expenseClaim.amount,
    currency: expenseClaim.currency,
    claimDate: expenseClaim.claimDate,
    purpose: expenseClaim.purpose,
    referenceNo: expenseClaim.referenceNo || '',
    description: expenseClaim.description || ''
  })
}

function syncDepartmentSelection() {
  const selectedEmployee = employeeOptions.value.find((item) => item.id === expenseClaimForm.employeeId)
  if (!selectedEmployee?.departmentId) {
    return
  }

  if (!expenseClaimForm.departmentId || expenseClaimForm.departmentId !== selectedEmployee.departmentId) {
    expenseClaimForm.departmentId = selectedEmployee.departmentId
  }
}

async function loadReferences() {
  const [employees, departments] = await Promise.all([
    api.listEmployees({ page: 1, limit: 200 }),
    api.listDepartments({ page: 1, limit: 200 })
  ])

  employeeOptions.value = employees.data
  departmentOptions.value = departments.data
}

async function loadExpenseClaims(options: { notifyInvalid?: boolean } = {}) {
  if (dateRangeError.value) {
    if (options.notifyInvalid) {
      toast.add({
        title: '日期范围无效',
        description: dateRangeError.value,
        color: 'warning'
      })
    }
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listExpenseClaims({
      page: page.value,
      limit,
      search: search.value || undefined,
      employeeId: normalizeFilterValue(employeeFilter.value),
      departmentId: normalizeFilterValue(departmentFilter.value),
      status: normalizeFilterValue(statusFilter.value),
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined
    })

    rows.value = result.data
    total.value = result.total
  } catch (error) {
    errorMessage.value = api.toErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function clearDateRange() {
  dateFrom.value = ''
  dateTo.value = ''
  page.value = 1
  void loadExpenseClaims()
}

function resetForm() {
  Object.assign(expenseClaimForm, createExpenseClaimForm())

  if (employeeOptions.value[0]) {
    expenseClaimForm.employeeId = employeeOptions.value[0].id
  }

  syncDepartmentSelection()
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(expenseClaim: ExpenseClaim) {
  formMode.value = 'edit'
  editingId.value = expenseClaim.id
  assignForm(expenseClaim)
  syncDepartmentSelection()
  open.value = true
}

function openViewModal(expenseClaim: ExpenseClaim) {
  formMode.value = 'view'
  editingId.value = expenseClaim.id
  assignForm(expenseClaim)
  open.value = true
}

async function submitExpenseClaim() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updateExpenseClaim(editingId.value, expenseClaimForm)
      toast.add({ title: '报销单已更新', color: 'success' })
    } else {
      await api.createExpenseClaim(expenseClaimForm)
      toast.add({ title: '报销单已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadExpenseClaims()
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

async function removeExpenseClaim(expenseClaim: ExpenseClaim) {
  if (!window.confirm(`确认删除报销单“${expenseClaim.expenseClaimNo}”吗？`)) {
    return
  }

  try {
    await api.deleteExpenseClaim(expenseClaim.id)
    toast.add({ title: '报销单已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadExpenseClaims()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

async function executeExpenseClaim(expenseClaim: ExpenseClaim) {
  if (!window.confirm(`确认执行报销单“${expenseClaim.expenseClaimNo}”吗？执行后会生成付款与财务交易。`)) {
    return
  }

  try {
    const result = await api.executeExpenseClaim(expenseClaim.id)
    toast.add({
      title: '报销单已执行',
      description: result.transactionCode
        ? `已生成财务交易 ${result.transactionCode}`
        : '报销结果已进入财务交易视图。',
      color: 'success'
    })
    await loadExpenseClaims()
  } catch (error) {
    toast.add({
      title: '执行失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(expenseClaim: ExpenseClaim): any {
  const draftActions: any[] = expenseClaim.status === 'DRAFT'
    ? [
        {
          label: '编辑',
          icon: 'i-lucide-pencil',
          onSelect: () => {
            openEditModal(expenseClaim)
          }
        },
        {
          label: '执行报销',
          icon: 'i-lucide-play',
          onSelect: () => {
            void executeExpenseClaim(expenseClaim)
          }
        },
        {
          label: '删除',
          icon: 'i-lucide-trash-2',
          color: 'error',
          onSelect: () => {
            void removeExpenseClaim(expenseClaim)
          }
        }
      ]
    : []

  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(expenseClaim)
      }
    },
    ...draftActions
  ]]
}

watch(page, () => {
  void loadExpenseClaims()
})

watch([statusFilter, employeeFilter, departmentFilter], () => {
  page.value = 1
  void loadExpenseClaims()
})

watch([dateFrom, dateTo], () => {
  page.value = 1
  void loadExpenseClaims()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadExpenseClaims()
  }, 250)
})

watch(() => expenseClaimForm.employeeId, () => {
  syncDepartmentSelection()
})

onMounted(async () => {
  await loadReferences()
  await loadExpenseClaims()
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
              报销单
            </p>
            <p class="text-sm text-muted">
              先维护业务单据，执行后复用现有付款与 finance 交易结果层
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增报销单
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索报销单号、员工、用途或参考号" />

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
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="业务状态"
              class="min-w-40"
            />
            <UInput v-model="dateFrom" type="date" class="min-w-40" />
            <UInput v-model="dateTo" type="date" class="min-w-40" />
            <UButton
              v-if="dateFrom || dateTo"
              color="neutral"
              variant="ghost"
              icon="i-lucide-eraser"
              @click="clearDateRange"
            >
              清空日期
            </UButton>
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadExpenseClaims({ notifyInvalid: true })">
              刷新
            </UButton>
          </div>
        </div>

        <UAlert
          v-if="dateRangeError"
          color="warning"
          variant="subtle"
          icon="i-lucide-calendar-range"
          :description="dateRangeError"
        />

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
              正在加载报销单列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #amount-cell="{ row }">
                {{ formatCurrency(row.original.amount, row.original.currency) }}
              </template>

              <template #claimDate-cell="{ row }">
                {{ formatDate(row.original.claimDate) }}
              </template>

              <template #status-cell="{ row }">
                <UBadge :color="hrStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(expenseClaimStatusOptions, row.original.status) }}
                </UBadge>
              </template>

              <template #paymentStatus-cell="{ row }">
                <UBadge
                  :color="row.original.paymentStatus ? hrStatusColor(row.original.paymentStatus) : 'neutral'"
                  variant="subtle"
                >
                  {{ row.original.paymentStatus ? findOptionLabel(expenseClaimStatusOptions, row.original.paymentStatus) : '-' }}
                </UBadge>
              </template>

              <template #transactionCode-cell="{ row }">
                {{ row.original.transactionCode || '-' }}
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
            <UCard class="w-full sm:max-w-5xl">
              <template #header>
                <div>
                  <p class="text-base font-semibold text-highlighted">
                    {{ formMode === 'view' ? '报销单详情' : formMode === 'edit' ? '编辑报销单' : '新增报销单' }}
                  </p>
                  <p class="text-sm text-muted">
                    报销单执行后会自动创建员工报销付款并生成一笔 finance 交易。
                  </p>
                </div>
              </template>

              <UForm :schema="expenseClaimSchema" :state="expenseClaimForm" class="space-y-4" @submit="submitExpenseClaim">
                <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  <UFormField name="expenseClaimNo" label="报销单号">
                    <UInput v-model="expenseClaimForm.expenseClaimNo" :disabled="isReadonly" placeholder="为空则自动生成" />
                  </UFormField>

                  <UFormField name="currency" label="币种" required>
                    <UInput v-model="expenseClaimForm.currency" :disabled="isReadonly" placeholder="如 CNY" />
                  </UFormField>

                  <UFormField name="employeeId" label="员工" required class="xl:col-span-2">
                    <USelect
                      v-model="expenseClaimForm.employeeId"
                      :items="employeeFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                      placeholder="请选择员工"
                    />
                  </UFormField>

                  <UFormField name="departmentId" label="归属部门" required class="xl:col-span-2">
                    <USelect
                      v-model="expenseClaimForm.departmentId"
                      :items="departmentFormItems"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                      placeholder="请选择部门"
                    />
                  </UFormField>

                  <UFormField name="amount" label="金额" required>
                    <UInput v-model.number="expenseClaimForm.amount" type="number" min="0" step="0.01" :disabled="isReadonly" placeholder="请输入报销金额" />
                  </UFormField>

                  <UFormField name="claimDate" label="报销日期" required>
                    <UInput v-model="expenseClaimForm.claimDate" type="date" :disabled="isReadonly" />
                  </UFormField>

                  <UFormField name="purpose" label="报销用途" required class="lg:col-span-2 xl:col-span-3">
                    <UInput v-model="expenseClaimForm.purpose" :disabled="isReadonly" placeholder="如 团队办公用品报销" />
                  </UFormField>

                  <UFormField name="referenceNo" label="参考号">
                    <UInput v-model="expenseClaimForm.referenceNo" :disabled="isReadonly" placeholder="可选" />
                  </UFormField>

                  <UFormField name="description" label="描述" class="lg:col-span-2 xl:col-span-3">
                    <UTextarea
                      v-model="expenseClaimForm.description"
                      :rows="4"
                      :disabled="isReadonly"
                      placeholder="补充报销背景、附件说明或备注"
                    />
                  </UFormField>
                </div>

                <div v-if="formMode === 'view'" class="grid gap-3 rounded-2xl border border-default bg-muted/30 p-4 text-sm text-muted lg:grid-cols-3">
                  <div>
                    <p class="font-medium text-highlighted">
                      付款单
                    </p>
                    <p>{{ rows.find((item) => item.id === editingId)?.paymentOrderNo || '-' }}</p>
                  </div>
                  <div>
                    <p class="font-medium text-highlighted">
                      付款状态
                    </p>
                    <p>{{ rows.find((item) => item.id === editingId)?.paymentStatus || '-' }}</p>
                  </div>
                  <div>
                    <p class="font-medium text-highlighted">
                      财务交易
                    </p>
                    <p>{{ rows.find((item) => item.id === editingId)?.transactionCode || '-' }}</p>
                  </div>
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
