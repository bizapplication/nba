<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const colorMode = useColorMode()
const open = ref(false)
const collapsed = ref(false)
const notificationsOpen = useState('notifications-open', () => false)

const isDark = computed(() => colorMode.value === 'dark')

const routeMeta = [
  {
    prefix: '/erp/finance',
    label: '财经管理',
    subtitle: '银行、总账、账户与交易结果层统一收口在外层 ERP 工作台。',
    icon: 'i-lucide-landmark'
  },
  {
    prefix: '/erp/procurement',
    label: '采购管理',
    subtitle: '供应商、订单、收货、发票与付款链路已经全部迁入外层前端。',
    icon: 'i-lucide-shopping-cart'
  },
  {
    prefix: '/erp/crm',
    label: '客户关系管理',
    subtitle: '该域继续保留一级入口，但已明确为其他部门负责，不再属于当前 ERP 团队正式 owning scope。',
    icon: 'i-lucide-users'
  },
  {
    prefix: '/erp/hr',
    label: '人力资源',
    subtitle: '部门、岗位、员工、任职与报销单在统一 ERP 壳内协同工作。',
    icon: 'i-lucide-users-round'
  },
  {
    prefix: '/platform',
    label: '平台管理',
    subtitle: '平台页继续保留在外层仓库，作为 ERP 的共享能力基座。',
    icon: 'i-lucide-settings-2'
  },
  {
    prefix: '/crm',
    label: 'CRM 对照入口',
    subtitle: '该入口作为并列域对照页保留，不承担当前 ERP 团队的正式验收职责。',
    icon: 'i-lucide-rocket'
  },
  {
    prefix: '/erp',
    label: '企业工作台',
    subtitle: '根首页已统一收口到 /erp。当前 ERP owning scope 收口为 Finance / Procurement / HR，CRM 作为其他部门负责的并列域保留一级入口。',
    icon: 'i-lucide-panels-top-left'
  }
]

const currentSection = computed(() => {
  return routeMeta.find((item) => route.path.startsWith(item.prefix)) ?? {
    prefix: '/',
    label: '企业工作台',
    subtitle: '当前 outer 仓库以 /erp 作为统一工作台首页，当前 ERP 正式 owning scope 为 Finance / Procurement / HR。',
    icon: 'i-lucide-layout-dashboard'
  }
})

const primaryLinks = computed<NavigationMenuItem[]>(() => [
  {
    label: '客户关系管理',
    icon: 'i-lucide-users',
    to: '/erp/crm'
  },
  {
    label: '企业资源计划',
    icon: 'i-lucide-building-2',
    defaultOpen: true,
    children: [
      { label: '企业工作台', icon: 'i-lucide-panels-top-left', to: '/erp' },
      {
        label: '财经管理',
        icon: 'i-lucide-landmark',
        defaultOpen: true,
        children: [
          { label: '财务首页', icon: 'i-lucide-layout-dashboard', to: '/erp/finance' },
          { label: '银行管理', icon: 'i-lucide-building', to: '/erp/finance/banks' },
          { label: '总账管理', icon: 'i-lucide-book-open', to: '/erp/finance/ledgers' },
          { label: '账户管理', icon: 'i-lucide-book-key', to: '/erp/finance/accounts' },
          { label: '交易管理', icon: 'i-lucide-arrow-right-left', to: '/erp/finance/transactions' }
        ]
      },
      {
        label: '采购管理',
        icon: 'i-lucide-shopping-cart',
        defaultOpen: true,
        children: [
          { label: '采购首页', icon: 'i-lucide-layout-dashboard', to: '/erp/procurement' },
          { label: '商品 / 物料', icon: 'i-lucide-package-2', to: '/erp/procurement/products' },
          { label: '供应商管理', icon: 'i-lucide-handshake', to: '/erp/procurement/vendors' },
          { label: '供应商银行信息', icon: 'i-lucide-landmark', to: '/erp/procurement/vendor-bank-accounts' },
          { label: '采购订单', icon: 'i-lucide-file-text', to: '/erp/procurement/purchase-orders' },
          { label: '收货记录', icon: 'i-lucide-truck', to: '/erp/procurement/goods-receipts' },
          { label: '供应商发票', icon: 'i-lucide-receipt-text', to: '/erp/procurement/vendor-invoices' },
          { label: '付款单', icon: 'i-lucide-wallet-cards', to: '/erp/procurement/payments' }
        ]
      },
      {
        label: '人力资源',
        icon: 'i-lucide-users-round',
        defaultOpen: true,
        children: [
          { label: 'HR 首页', icon: 'i-lucide-layout-dashboard', to: '/erp/hr' },
          { label: '部门管理', icon: 'i-lucide-building-2', to: '/erp/hr/departments' },
          { label: '岗位管理', icon: 'i-lucide-briefcase-business', to: '/erp/hr/positions' },
          { label: '员工管理', icon: 'i-lucide-id-card', to: '/erp/hr/employees' },
          { label: '任职关系', icon: 'i-lucide-network', to: '/erp/hr/employments' },
          { label: '报销单', icon: 'i-lucide-receipt', to: '/erp/hr/expense-claims' }
        ]
      }
    ]
  },
  {
    label: '平台管理',
    icon: 'i-lucide-settings-2',
    defaultOpen: true,
    children: [
      { label: '平台首页', icon: 'i-lucide-layout-dashboard', to: '/platform' }
    ]
  }
])

const searchGroups = computed(() => [
  {
    id: 'crm',
    label: '客户关系管理（并列域）',
    items: [
      { label: '客户关系管理入口', icon: 'i-lucide-users', to: '/erp/crm' }
    ]
  },
  {
    id: 'erp-finance',
    label: '财经管理',
    items: [
      { label: '财务首页', icon: 'i-lucide-layout-dashboard', to: '/erp/finance' },
      { label: '银行管理', icon: 'i-lucide-building', to: '/erp/finance/banks' },
      { label: '总账管理', icon: 'i-lucide-book-open', to: '/erp/finance/ledgers' },
      { label: '账户管理', icon: 'i-lucide-book-key', to: '/erp/finance/accounts' },
      { label: '交易管理', icon: 'i-lucide-arrow-right-left', to: '/erp/finance/transactions' }
    ]
  },
  {
    id: 'erp-procurement',
    label: '采购管理',
    items: [
      { label: '采购首页', icon: 'i-lucide-layout-dashboard', to: '/erp/procurement' },
      { label: '商品 / 物料', icon: 'i-lucide-package-2', to: '/erp/procurement/products' },
      { label: '供应商管理', icon: 'i-lucide-handshake', to: '/erp/procurement/vendors' },
      { label: '供应商银行信息', icon: 'i-lucide-landmark', to: '/erp/procurement/vendor-bank-accounts' },
      { label: '采购订单', icon: 'i-lucide-file-text', to: '/erp/procurement/purchase-orders' },
      { label: '收货记录', icon: 'i-lucide-truck', to: '/erp/procurement/goods-receipts' },
      { label: '供应商发票', icon: 'i-lucide-receipt-text', to: '/erp/procurement/vendor-invoices' },
      { label: '付款单', icon: 'i-lucide-wallet-cards', to: '/erp/procurement/payments' }
    ]
  },
  {
    id: 'erp-hr',
    label: '人力资源',
    items: [
      { label: 'HR 首页', icon: 'i-lucide-layout-dashboard', to: '/erp/hr' },
      { label: '部门管理', icon: 'i-lucide-building-2', to: '/erp/hr/departments' },
      { label: '岗位管理', icon: 'i-lucide-briefcase-business', to: '/erp/hr/positions' },
      { label: '员工管理', icon: 'i-lucide-id-card', to: '/erp/hr/employees' },
      { label: '任职关系', icon: 'i-lucide-network', to: '/erp/hr/employments' },
      { label: '报销单', icon: 'i-lucide-receipt', to: '/erp/hr/expense-claims' }
    ]
  },
  {
    id: 'platform',
    label: '平台管理',
    items: [
      { label: '平台首页', icon: 'i-lucide-layout-dashboard', to: '/platform' }
    ]
  }
])

watch(
  () => route.fullPath,
  () => {
    open.value = false
  }
)

function toggleColorMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <UDashboardGroup class="erp-shell">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      v-model:collapsed="collapsed"
      collapsible
      resizable
      class="erp-shell-sidebar"
    >
      <template #header>
        <TenantsMenu :collapsed="collapsed" />
      </template>

      <div class="erp-shell-sidebar-body">
        <UCard variant="subtle" class="erp-shell-sidebar-intro">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
              Unified Navigation
            </p>
            <p class="text-sm font-semibold text-highlighted">
              CRM 继续保留一级入口，当前 ERP owning scope 已收口到 Finance / Procurement / HR
            </p>
            <p v-if="!collapsed" class="text-xs leading-5 text-muted">
              顶部现在只保留通知、主题切换等工具动作，业务导航统一回到左侧主层级。
            </p>
          </div>
        </UCard>

        <UDashboardSearchButton class="w-full" />
        <UNavigationMenu orientation="vertical" :items="primaryLinks" />
      </div>

      <template #footer>
        <div class="space-y-3">
          <UCard
            v-if="!collapsed"
            variant="subtle"
            class="rounded-2xl border border-default/70"
          >
            <div class="space-y-1">
              <p class="text-xs uppercase tracking-[0.22em] text-muted">
                Workspace
              </p>
              <p class="text-sm font-semibold text-highlighted">
                当前正式 scope = Finance / Procurement / HR
              </p>
            </div>
          </UCard>
          <UserMenu :collapsed="collapsed" />
        </div>
      </template>
    </UDashboardSidebar>

    <div class="erp-shell-main">
      <header class="erp-shell-header">
        <div class="erp-shell-header-row">
          <div class="erp-shell-header-copy">
            <UButton
              icon="i-lucide-panel-left-open"
              color="neutral"
              variant="ghost"
              class="lg:hidden"
              @click="open = true"
            />

            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge variant="soft" color="primary">
                  NBA Workspace
                </UBadge>
                <UBadge variant="outline" color="neutral">
                  {{ currentSection.label }}
                </UBadge>
              </div>

              <div class="flex items-start gap-3">
                <div class="erp-shell-header-icon">
                  <UIcon :name="currentSection.icon" class="size-5" />
                </div>
                <div class="min-w-0 space-y-1">
                  <h1 class="text-xl font-semibold text-highlighted sm:text-2xl">
                    {{ currentSection.label }}
                  </h1>
                  <p class="max-w-3xl text-sm leading-6 text-toned">
                    {{ currentSection.subtitle }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="erp-shell-header-actions">
            <UButton
              icon="i-lucide-bell"
              color="neutral"
              variant="ghost"
              @click="notificationsOpen = true"
            />
            <UButton
              :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
              color="neutral"
              variant="ghost"
              @click="toggleColorMode"
            />
          </div>
        </div>
      </header>

      <main class="erp-shell-body">
        <slot />
      </main>
    </div>

    <UDashboardSearch :groups="searchGroups" />
    <NotificationsSlideover />
  </UDashboardGroup>
</template>
