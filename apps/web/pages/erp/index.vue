<script setup lang="ts">
const workspaceAreas = [
  {
    title: '主页',
    path: '/home',
    icon: 'i-lucide-house',
    description: '站点总入口已经切到聊天优先的 Agent 工作台首页，负责发起任务并流向 workspace。',
    entries: ['Agent 首页', '经营看板', '任务工作区']
  },
  {
    title: '客户关系管理',
    path: '/erp/crm',
    icon: 'i-lucide-users',
    description: '该域作为其他部门负责的并列入口继续保留，不纳入当前 ERP 团队正式 owning scope。',
    entries: ['并列域入口', '其他部门负责']
  },
  {
    title: '企业资源计划',
    path: '/erp/finance',
    icon: 'i-lucide-building-2',
    description: '当前 ERP 团队正式 owning scope 收口为财经、采购与人力资源三个工作区。',
    entries: ['财经管理', '采购管理', '人力资源']
  },
  {
    title: '平台管理',
    path: '/platform',
    icon: 'i-lucide-settings-2',
    description: '平台页继续承接共享能力、系统配置与后续平台治理入口。',
    entries: ['平台首页']
  }
]

const moduleCards = [
  {
    title: '财经管理',
    path: '/erp/finance',
    icon: 'i-lucide-landmark',
    description: '银行、总账、账户与交易结果层已经在外层前端完成正式承接。'
  },
  {
    title: '采购管理',
    path: '/erp/procurement',
    icon: 'i-lucide-shopping-cart',
    description: '供应商、订单、收货、发票与付款链路已统一收口到 outer workspace。'
  },
  {
    title: '人力资源',
    path: '/erp/hr',
    icon: 'i-lucide-users-round',
    description: '部门、岗位、员工、任职关系与报销单都在当前壳层中可直达。'
  }
]

const signals = [
  {
    label: '当前正式 scope',
    value: '3 大域'
  },
  {
    label: '站点总入口',
    value: '/home'
  },
  {
    label: '并列域状态',
    value: 'CRM 保留入口'
  }
]
</script>

<template>
  <div class="space-y-6">
    <UCard class="rounded-3xl border border-primary/10 bg-gradient-to-br from-white via-white to-primary/5 shadow-sm">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] xl:items-start">
        <div class="space-y-5">
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge variant="soft" color="primary">
                Unified Workspace
              </UBadge>
              <UBadge variant="outline" color="neutral">
                /erp
              </UBadge>
            </div>
            <div class="space-y-2">
              <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
                企业工作台
              </h2>
              <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
                当前 `/erp` 继续作为正式业务工作台，站点新的总入口已经切到 `/home`。outer 仓库现在保留 Home / CRM / ERP / 平台 四个并列入口，其中 ERP 团队本轮正式 owning scope 明确收口为 Finance / Procurement / HR。
              </p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div
              v-for="signal in signals"
              :key="signal.label"
              class="rounded-2xl border border-default/70 bg-default/40 px-4 py-4"
            >
              <p class="text-xs uppercase tracking-[0.22em] text-muted">
                {{ signal.label }}
              </p>
              <p class="mt-2 text-lg font-semibold text-highlighted">
                {{ signal.value }}
              </p>
            </div>
          </div>
        </div>

        <UCard variant="subtle" class="rounded-3xl border border-default/70">
          <template #header>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-highlighted">
                并列主入口
              </p>
              <p class="text-xs leading-6 text-muted">
                左侧导航继续保留 Home / CRM / ERP / 平台 四个一级入口，其中 CRM 仅保留并列域入口，不再作为当前 ERP 团队正式模块展开。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <NuxtLink
              v-for="area in workspaceAreas"
              :key="area.path"
              :to="area.path"
              class="group block rounded-2xl border border-default/70 bg-default/20 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UIcon :name="area.icon" class="size-5" />
                </div>
                <div class="min-w-0 space-y-2">
                  <div>
                    <p class="text-sm font-semibold text-highlighted">
                      {{ area.title }}
                    </p>
                    <p class="mt-1 text-xs leading-6 text-muted">
                      {{ area.description }}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <UBadge
                      v-for="entry in area.entries"
                      :key="entry"
                      variant="soft"
                      color="neutral"
                    >
                      {{ entry }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </UCard>
      </div>
    </UCard>

    <UCard class="rounded-3xl border border-default/70">
      <template #header>
        <div class="space-y-1">
          <h3 class="text-lg font-semibold text-highlighted">
            当前正式模块工作区
          </h3>
          <p class="text-sm leading-6 text-muted">
            以下入口对应当前 outer 仓库由 ERP 团队继续正式承接和老板验收的业务工作区。
          </p>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="card in moduleCards"
          :key="card.path"
          :to="card.path"
          class="group block rounded-2xl border border-default/70 bg-default/20 px-5 py-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
        >
          <div class="space-y-4">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UIcon :name="card.icon" class="size-5" />
            </div>
            <div class="space-y-2">
              <p class="text-base font-semibold text-highlighted">
                {{ card.title }}
              </p>
              <p class="text-sm leading-6 text-toned">
                {{ card.description }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>
