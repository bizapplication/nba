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
              并列域入口 / 其他部门负责
            </p>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="finance-page space-y-6">
        <UCard class="border-primary/20 bg-primary/5">
          <div class="space-y-3">
            <p class="text-sm font-medium text-primary">
              Ownership Realignment
            </p>
            <h2 class="text-2xl font-semibold text-highlighted">
              CRM 继续保留在工作台一级导航中，但不再属于当前 ERP 团队正式 owning scope
            </h2>
            <p class="max-w-3xl text-sm leading-7 text-toned">
              本轮不删除现有 CRM 页面、代理或后端能力，也不回退历史 Phase 3 工程成果。当前只做边界收口：CRM 作为其他部门负责的并列域继续保留入口，但不再纳入当前 ERP 团队的正式模块展示与老板验收范围。
            </p>
            <div class="flex flex-wrap gap-3">
              <UButton to="/erp" color="primary" icon="i-lucide-arrow-left">
                返回企业工作台
              </UButton>
              <UButton to="/platform" color="neutral" variant="soft" icon="i-lucide-settings-2">
                前往平台管理
              </UButton>
            </div>
          </div>
        </UCard>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <UCard>
            <template #header>
              <div class="space-y-1">
                <p class="text-sm font-semibold text-highlighted">
                  当前 ERP 团队正式收口范围
                </p>
                <p class="text-xs leading-6 text-muted">
                  当前老板验收与持续收口的主线只覆盖以下三个业务工作区。
                </p>
              </div>
            </template>

            <div class="grid gap-3 md:grid-cols-3">
              <NuxtLink
                v-for="item in [
                  { title: '财经管理', to: '/erp/finance', icon: 'i-lucide-landmark', desc: '银行、总账、账户与交易结果层。' },
                  { title: '采购管理', to: '/erp/procurement', icon: 'i-lucide-shopping-cart', desc: '供应商、订单、收货、发票与付款链路。' },
                  { title: '人力资源', to: '/erp/hr', icon: 'i-lucide-users-round', desc: '员工主数据、任职关系与报销链路。' }
                ]"
                :key="item.to"
                :to="item.to"
                class="block rounded-2xl border border-default/70 bg-default/20 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
              >
                <div class="space-y-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UIcon :name="item.icon" class="size-5" />
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-semibold text-highlighted">
                      {{ item.title }}
                    </p>
                    <p class="text-xs leading-6 text-muted">
                      {{ item.desc }}
                    </p>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </UCard>

          <UCard variant="subtle">
            <template #header>
              <div class="space-y-1">
                <p class="text-sm font-semibold text-highlighted">
                  当前处理原则
                </p>
                <p class="text-xs leading-6 text-muted">
                  这轮是边界收口，不是高风险代码退场。
                </p>
              </div>
            </template>

            <div class="space-y-3 text-sm leading-7 text-toned">
              <p>
                现有 CRM 页面、代理和后端服务继续保留，避免因激进删除引入不必要回归。
              </p>
              <p>
                当前工作台只把 CRM 保留为一个并列入口和归属说明页，不再在首页、子导航和老板验收清单里把它当成 ERP 团队继续经营的正式模块。
              </p>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
