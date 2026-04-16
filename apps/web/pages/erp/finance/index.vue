<script setup lang="ts">
const api = useFinanceApi()

const loading = ref(true)
const errorMessage = ref('')
const stats = reactive({
  bankTotal: 0,
  activeLedgerTotal: 0,
  activeAccountTotal: 0,
  postedTransactionTotal: 0,
  pendingTransactionTotal: 0
})

const summaryCards = computed(() => [
  { label: '银行主体', value: stats.bankTotal, hint: 'Finance 主数据入口', icon: 'i-lucide-building' },
  { label: '启用总账', value: stats.activeLedgerTotal, hint: '当前可承接业务的账簿', icon: 'i-lucide-book-open' },
  { label: '启用账户', value: stats.activeAccountTotal, hint: '当前可用科目', icon: 'i-lucide-book-key' },
  { label: '已过账交易', value: stats.postedTransactionTotal, hint: '已经进入结果层的业务', icon: 'i-lucide-badge-check' },
  { label: '待过账交易', value: stats.pendingTransactionTotal, hint: '还可编辑或继续过账', icon: 'i-lucide-clock-3' }
])

const quickActions = [
  { title: '维护账户与方向', description: '查看账户余额、正常余额方向和父子科目关系。', to: '/erp/finance/accounts', icon: 'i-lucide-book-key' },
  { title: '处理交易过账', description: '创建、过账和取消过账都在交易页完成。', to: '/erp/finance/transactions', icon: 'i-lucide-arrow-right-left' },
  { title: '整理银行与总账', description: '主数据、账簿和账户关系先稳住，再承接业务结果。', to: '/erp/finance/ledgers', icon: 'i-lucide-landmark' }
]

const flowSteps = [
  '银行与总账先定义财务承接边界。',
  '账户维护正常余额方向与父子层级。',
  '业务在交易页形成借贷分录。',
  '过账后结果统一回到账户余额与交易结果层。'
]

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [banks, activeLedgers, activeAccounts, postedTransactions, pendingTransactions] = await Promise.all([
      api.listBanks({ page: 1, limit: 1 }),
      api.listLedgers({ page: 1, limit: 1, status: 'active' }),
      api.listAccounts({ page: 1, limit: 1, status: 'ACTIVE' }),
      api.listTransactions({ page: 1, limit: 1, status: 'POSTED' }),
      api.listTransactions({ page: 1, limit: 1, status: 'PENDING' })
    ])

    stats.bankTotal = banks.total
    stats.activeLedgerTotal = activeLedgers.total
    stats.activeAccountTotal = activeAccounts.total
    stats.postedTransactionTotal = postedTransactions.total
    stats.pendingTransactionTotal = pendingTransactions.total
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
            <p class="text-base font-semibold text-highlighted">
              财务首页
            </p>
            <p class="text-sm text-muted">
              Finance 结果层与会计主数据工作台
            </p>
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
                <UBadge color="primary" variant="soft">Finance Dashboard</UBadge>
                <UBadge color="neutral" variant="outline">最小财务闭环</UBadge>
              </div>
              <div class="space-y-2">
                <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
                  先把银行、总账、账户和交易结果层打通，再承接其他业务域回流。
                </h2>
                <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
                  当前 Finance 负责财务主数据和结果层。采购付款、客户收款、员工报销最终都会回到这里，用统一交易页完成过账与结果追踪。
                </p>
              </div>
            </div>

            <UCard variant="subtle" class="rounded-3xl border border-default/70">
              <template #header>
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-highlighted">当前设计为什么这样做</p>
                  <p class="text-xs leading-6 text-muted">
                    先做单币种 MVP，先跑通主数据、业务单据与财务结果层，不在这一轮提前扩成完整财务套件。
                  </p>
                </div>
              </template>

              <div class="space-y-3 text-sm leading-7 text-toned">
                <p>余额列按“借方为正、贷方为负”展示，方便业务侧直观看到账户一增一减的表现。</p>
                <p>“余额方向”列保留会计语义，显示该科目的正常余额方向，不等同于列表中正负号本身。</p>
              </div>
            </UCard>
          </div>
        </UCard>

        <UAlert v-if="errorMessage" color="error" variant="subtle" icon="i-lucide-triangle-alert" :description="errorMessage" />

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                <p class="text-sm leading-6 text-muted">
                  老板或业务负责人想快速看结果，可以从这三个入口直接进入。
                </p>
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
                <h3 class="text-lg font-semibold text-highlighted">最小业务链路</h3>
                <p class="text-sm leading-6 text-muted">当前 Finance 是其他业务域回流的统一结果层。</p>
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
