<script setup lang="ts">
import { z } from 'zod'

import type { Position, PositionFormState, PositionStatus } from '~/types/hr'
import {
  FILTER_ALL_VALUE,
  findOptionLabel,
  formatDateTime,
  normalizeFilterValue,
  toSelectItems
} from '~/utils/finance'
import { hrStatusColor, positionStatusOptions } from '~/utils/hr'

const api = useHrApi()
const toast = useToast()

const page = ref(1)
const limit = 10
const total = ref(0)
const rows = ref<Position[]>([])
const loading = ref(false)
const submitting = ref(false)
const open = ref(false)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const editingId = ref<string | null>(null)
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref<PositionStatus | typeof FILTER_ALL_VALUE>(FILTER_ALL_VALUE)

const statusItems = toSelectItems(positionStatusOptions)

const positionSchema = z.object({
  positionCode: z.string().min(1, '请输入岗位编码'),
  positionName: z.string().min(1, '请输入岗位名称'),
  status: z.enum(['active', 'inactive']),
  description: z.string().optional()
})

const positionForm = reactive<PositionFormState>(createPositionForm())

const columns = [
  { accessorKey: 'positionCode', header: '岗位编码' },
  { accessorKey: 'positionName', header: '岗位名称' },
  { accessorKey: 'employeeCount', header: '员工数' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'createTime', header: '创建时间' },
  { id: 'actions', header: '操作' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

const isReadonly = computed(() => formMode.value === 'view')

function createPositionForm(): PositionFormState {
  return {
    positionCode: '',
    positionName: '',
    status: 'active',
    description: ''
  }
}

function assignForm(position: Position) {
  Object.assign(positionForm, {
    positionCode: position.positionCode,
    positionName: position.positionName,
    status: position.status,
    description: position.description || ''
  })
}

async function loadPositions() {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await api.listPositions({
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
  Object.assign(positionForm, createPositionForm())
}

function openCreateModal() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  open.value = true
}

function openEditModal(position: Position) {
  formMode.value = 'edit'
  editingId.value = position.id
  assignForm(position)
  open.value = true
}

function openViewModal(position: Position) {
  formMode.value = 'view'
  editingId.value = position.id
  assignForm(position)
  open.value = true
}

async function submitPosition() {
  submitting.value = true

  try {
    if (formMode.value === 'edit' && editingId.value) {
      await api.updatePosition(editingId.value, positionForm)
      toast.add({ title: '岗位已更新', color: 'success' })
    } else {
      await api.createPosition(positionForm)
      toast.add({ title: '岗位已创建', color: 'success' })
      page.value = 1
    }

    open.value = false
    await loadPositions()
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

async function removePosition(position: Position) {
  if (!window.confirm(`确认删除岗位“${position.positionName}”吗？`)) {
    return
  }

  try {
    await api.deletePosition(position.id)
    toast.add({ title: '岗位已删除', color: 'success' })
    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    await loadPositions()
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: api.toErrorMessage(error),
      color: 'error'
    })
  }
}

function rowActions(position: Position): any {
  return [[
    {
      label: '详情',
      icon: 'i-lucide-eye',
      onSelect: () => {
        openViewModal(position)
      }
    },
    {
      label: '编辑',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditModal(position)
      }
    },
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        void removePosition(position)
      }
    }
  ]]
}

watch(page, () => {
  void loadPositions()
})

watch(statusFilter, () => {
  page.value = 1
  void loadPositions()
})

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    page.value = 1
    void loadPositions()
  }, 250)
})

onMounted(() => {
  void loadPositions()
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
              岗位管理
            </p>
            <p class="text-sm text-muted">
              维护 HR 岗位主数据与状态
            </p>
          </div>
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" color="primary" @click="openCreateModal">
            新增岗位
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <div class="finance-toolbar">
          <UInput v-model="search" icon="i-lucide-search" size="lg" placeholder="搜索岗位名称、编码或描述" />

          <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
            <USelect
              v-model="statusFilter"
              :items="statusItems"
              value-key="value"
              label-key="label"
              placeholder="状态"
              class="min-w-36"
            />
            <UButton color="neutral" variant="subtle" icon="i-lucide-rotate-cw" @click="loadPositions">
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
              正在加载岗位列表...
            </div>

            <UTable v-else :data="rows" :columns="columns">
              <template #status-cell="{ row }">
                <UBadge :color="hrStatusColor(row.original.status)" variant="subtle">
                  {{ findOptionLabel(positionStatusOptions, row.original.status) }}
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
                    {{ formMode === 'view' ? '岗位详情' : formMode === 'edit' ? '编辑岗位' : '新增岗位' }}
                  </p>
                  <p class="text-sm text-muted">
                    岗位用于承接员工任职关系和组织职责归属。
                  </p>
                </div>
              </template>

              <UForm :schema="positionSchema" :state="positionForm" class="space-y-4" @submit="submitPosition">
                <div class="grid gap-4 lg:grid-cols-2">
                  <UFormField name="positionCode" label="岗位编码" required>
                    <UInput v-model="positionForm.positionCode" :disabled="isReadonly" placeholder="如 POS-0003" />
                  </UFormField>

                  <UFormField name="positionName" label="岗位名称" required>
                    <UInput v-model="positionForm.positionName" :disabled="isReadonly" placeholder="请输入岗位名称" />
                  </UFormField>

                  <UFormField name="status" label="状态" required>
                    <USelect
                      v-model="positionForm.status"
                      :items="positionStatusOptions"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadonly"
                    />
                  </UFormField>

                  <UFormField name="description" label="描述" class="lg:col-span-2">
                    <UTextarea
                      v-model="positionForm.description"
                      :rows="4"
                      :disabled="isReadonly"
                      placeholder="补充岗位职责或说明"
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
