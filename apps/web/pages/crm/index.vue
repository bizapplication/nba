<script setup lang="ts">
const api = useCrmDomainApi()

const loading = ref(true)
const errorMessage = ref('')
const summary = reactive({
  customers: 0,
  opportunities: 0,
  orders: 0,
})

const summaryCards = computed(() => [
  { label: '客户总数', value: summary.customers, icon: 'i-lucide-users', tone: 'from-sky-500/15 to-sky-500/5 text-sky-600' },
  { label: '商机总数', value: summary.opportunities, icon: 'i-lucide-badge-dollar-sign', tone: 'from-amber-500/15 to-amber-500/5 text-amber-600' },
  { label: '订单总数', value: summary.orders, icon: 'i-lucide-file-text', tone: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600' },
])

const quickLinks = [
  {
    title: '客户管理',
    description: '维护客户主档、联系方式和公司信息，作为商机与订单的统一主数据源。',
    to: '/crm/customers',
    icon: 'i-lucide-users',
  },
  {
    title: '商机管理',
    description: '跟踪从识别到赢单的销售机会，管理阶段、金额和预计成交时间。',
    to: '/crm/opportunities',
    icon: 'i-lucide-badge-dollar-sign',
  },
  {
    title: '订单管理',
    description: '承接客户订单信息，维护订单状态和金额，作为成交结果层的业务记录。',
    to: '/crm/orders',
    icon: 'i-lucide-file-text',
  },
]

async function loadSummary() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [customers, opportunities, orders] = await Promise.all([
      api.listCustomers({ page: 1, limit: 1 }),
      api.listOpportunities({ page: 1, limit: 1 }),
      api.listOrders({ page: 1, limit: 1 }),
    ])

    summary.customers = customers.total
    summary.opportunities = opportunities.total
    summary.orders = orders.total
  } catch (error) {
    errorMessage.value = api.toErrorMessage(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadSummary()
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
              客户关系管理
            </p>
            <p class="text-sm text-muted">
              独立 CRM 域，围绕客户、商机和订单建立完整业务链路
            </p>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="rounded-3xl border border-primary/10 bg-gradient-to-br from-white via-white to-primary/5 shadow-sm">
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] xl:items-start">
            <div class="space-y-4">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge color="primary" variant="soft">
                  CRM Domain
                </UBadge>
                <UBadge color="neutral" variant="outline">
                  /crm
                </UBadge>
              </div>

              <div class="space-y-2">
                <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
                  CRM 已经从对照入口变成独立业务工作区
                </h2>
                <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
                  当前这条链路直接对接独立 CRM 服务与 PostgreSQL 数据库，页面风格跟 ERP 工作台保持一致，但接口与数据完全走自己的 `/api/crm/*` 通道。
                </p>
              </div>

              <div class="flex flex-wrap gap-3">
                <UButton to="/crm/customers" color="primary" icon="i-lucide-users">
                  进入客户管理
                </UButton>
                <UButton to="/crm/opportunities" color="neutral" variant="soft" icon="i-lucide-badge-dollar-sign">
                  查看商机
                </UButton>
              </div>
            </div>

            <UCard variant="subtle" class="rounded-3xl border border-default/70">
              <template #header>
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-highlighted">
                    当前联调状态
                  </p>
                  <p class="text-xs leading-6 text-muted">
                    用列表接口实时回填当前 CRM 域的数据规模。
                  </p>
                </div>
              </template>

              <UAlert
                v-if="errorMessage"
                color="error"
                variant="subtle"
                icon="i-lucide-triangle-alert"
                :description="errorMessage"
              />

              <div v-else class="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div
                  v-for="card in summaryCards"
                  :key="card.label"
                  class="rounded-2xl border border-default/70 bg-default/30 px-4 py-4"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-xs uppercase tracking-[0.18em] text-muted">
                        {{ card.label }}
                      </p>
                      <p class="mt-2 text-2xl font-semibold text-highlighted">
                        {{ loading ? '--' : card.value }}
                      </p>
                    </div>
                    <div :class="['flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br', card.tone]">
                      <UIcon :name="card.icon" class="size-5" />
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </UCard>

        <div class="grid gap-4 xl:grid-cols-3">
          <NuxtLink
            v-for="item in quickLinks"
            :key="item.to"
            :to="item.to"
            class="group block rounded-3xl border border-default/70 bg-default/20 px-5 py-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
          >
            <div class="space-y-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UIcon :name="item.icon" class="size-5" />
              </div>
              <div class="space-y-2">
                <p class="text-base font-semibold text-highlighted">
                  {{ item.title }}
                </p>
                <p class="text-sm leading-6 text-toned">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
