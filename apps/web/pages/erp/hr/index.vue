<script setup lang="ts">
const api = useHrApi()

const loading = ref(true)
const errorMessage = ref('')
const stats = reactive({
  departmentTotal: 0,
  positionTotal: 0,
  activeEmployeeTotal: 0,
  activeEmploymentTotal: 0,
  draftExpenseClaimTotal: 0,
  executedExpenseClaimTotal: 0
})

const summaryCards = computed(() => [
  { label: '部门', value: stats.departmentTotal, hint: '当前组织主数据', icon: 'i-lucide-building-2' },
  { label: '岗位', value: stats.positionTotal, hint: '岗位主数据', icon: 'i-lucide-briefcase-business' },
  { label: '在职员工', value: stats.activeEmployeeTotal, hint: '当前启用员工档案', icon: 'i-lucide-id-card' },
  { label: '有效任职', value: stats.activeEmploymentTotal, hint: '部门与岗位承接关系', icon: 'i-lucide-network' },
  { label: '待执行报销', value: stats.draftExpenseClaimTotal, hint: '待进入付款与财务结果层', icon: 'i-lucide-receipt' },
  { label: '已执行报销', value: stats.executedExpenseClaimTotal, hint: '已经回流 finance', icon: 'i-lucide-badge-check' }
])

const quickActions = [
  { title: '维护组织与岗位', description: '部门和岗位先稳定，员工与任职关系才能清楚落位。', to: '/erp/hr/departments', icon: 'i-lucide-building-2' },
  { title: '查看员工与任职', description: '员工档案和任职关系一起构成当前 HR 的最小主数据。', to: '/erp/hr/employees', icon: 'i-lucide-users-round' },
  { title: '处理报销单', description: '报销执行后自动创建付款并回流 finance 交易结果层。', to: '/erp/hr/expense-claims', icon: 'i-lucide-receipt-text' }
]

const flowSteps = [
  '部门与岗位先定义组织骨架。',
  '员工主档承接人员基础信息。',
  '任职关系承接部门、岗位与入职日期等关系信息。',
  '报销单先作为业务单据存在。',
  '执行报销后再复用 payment 与 finance 结果层。'
]

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [departments, positions, activeEmployees, activeEmployments, draftClaims, executedClaims] = await Promise.all([
      api.listDepartments({ page: 1, limit: 1 }),
      api.listPositions({ page: 1, limit: 1 }),
      api.listEmployees({ page: 1, limit: 1, status: 'active' }),
      api.listEmployments({ page: 1, limit: 1, status: 'active' }),
      api.listExpenseClaims({ page: 1, limit: 1, status: 'DRAFT' }),
      api.listExpenseClaims({ page: 1, limit: 1, status: 'EXECUTED' })
    ])

    stats.departmentTotal = departments.total
    stats.positionTotal = positions.total
    stats.activeEmployeeTotal = activeEmployees.total
    stats.activeEmploymentTotal = activeEmployments.total
    stats.draftExpenseClaimTotal = draftClaims.total
    stats.executedExpenseClaimTotal = executedClaims.total
  } catch (error) {
    errorMessage.value = api.toErrorMessage(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadDashboard()
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
            <p class="text-base font-semibold text-highlighted">人力资源</p>
            <p class="text-sm text-muted">HR 组织与报销闭环工作台</p>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page">
        <UCard class="rounded-3xl border border-primary/10 bg-gradient-to-br from-white via-white to-primary/5 shadow-sm">
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)] xl:items-start">
            <div class="space-y-4">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge color="primary" variant="soft">HR Dashboard</UBadge>
                <UBadge color="neutral" variant="outline">组织与报销最小闭环</UBadge>
              </div>
              <div class="space-y-2">
                <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
                  先把组织、岗位、员工和任职关系理顺，再让报销结果稳定回流财务。
                </h2>
                <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
                  当前 HR 不引入完整薪资、考勤或审批引擎，而是先把组织和人员主数据打稳，再把报销作为最小业务单据接入付款与财务结果层。
                </p>
              </div>
            </div>

            <UCard variant="subtle" class="rounded-3xl border border-default/70">
              <template #header>
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-highlighted">当前设计重点</p>
                  <p class="text-xs leading-6 text-muted">员工与任职关系仍保持最小分工，本轮不提前进入字段体系重构。</p>
                </div>
              </template>

              <div class="space-y-3 text-sm leading-7 text-toned">
                <p>报销单执行后会自动生成员工付款，并继续复用 finance 交易结果层。</p>
                <p>当前仍以单币种 MVP 为准，优先保证组织与报销闭环稳定可演示。</p>
              </div>
            </UCard>
          </div>
        </UCard>

        <UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-triangle-alert" :description="errorMessage" />

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <UCard v-for="card in summaryCards" :key="card.label" class="rounded-2xl border border-default/70">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UIcon :name="card.icon" class="size-5" />
                </div>
                <UBadge color="neutral" variant="soft">{{ loading ? '统计中' : '已更新' }}</UBadge>
              </div>
              <div>
                <p class="text-sm text-muted">{{ card.label }}</p>
                <p class="mt-2 text-2xl font-semibold text-highlighted">{{ loading ? '...' : card.value }}</p>
                <p class="mt-2 text-xs leading-6 text-toned">{{ card.hint }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <UCard class="rounded-3xl border border-default/70">
            <template #header>
              <div class="space-y-1">
                <h3 class="text-lg font-semibold text-highlighted">关键动作</h3>
                <p class="text-sm leading-6 text-muted">老板想快速看 HR 当前能做什么，可以直接从这三类动作进入。</p>
              </div>
            </template>

            <div class="grid gap-4 md:grid-cols-3">
              <NuxtLink v-for="action in quickActions" :key="action.to" :to="action.to" class="group block rounded-2xl border border-default/70 bg-default/20 px-5 py-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
                <div class="space-y-4">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UIcon :name="action.icon" class="size-5" />
                  </div>
                  <div class="space-y-2">
                    <p class="text-base font-semibold text-highlighted">{{ action.title }}</p>
                    <p class="text-sm leading-6 text-toned">{{ action.description }}</p>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </UCard>

          <UCard class="rounded-3xl border border-default/70">
            <template #header>
              <div class="space-y-1">
                <h3 class="text-lg font-semibold text-highlighted">HR 最小业务链路</h3>
                <p class="text-sm leading-6 text-muted">这一页用来解释 HR 为什么当前只先做到组织与报销闭环。</p>
              </div>
            </template>

            <div class="space-y-3">
              <div v-for="(step, index) in flowSteps" :key="step" class="flex items-start gap-3 rounded-2xl border border-default/70 bg-default/20 px-4 py-4">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{{ index + 1 }}</div>
                <p class="text-sm leading-6 text-toned">{{ step }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
