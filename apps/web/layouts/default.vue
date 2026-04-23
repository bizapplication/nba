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
    prefix: '/home/chat',
    label: 'Agent 会话',
    subtitle: '查看单条 run 的消息流、关联文件和输出摘要；当前仍为 UI-only 演示语义。',
    icon: 'i-lucide-messages-square'
  },
  {
    prefix: '/home/workspace',
    label: '任务工作区',
    subtitle: '给操作者继续处理 run、历史对话、附件与输出草稿的地方。',
    icon: 'i-lucide-layout-dashboard'
  },
  {
    prefix: '/home/dashboard',
    label: '经营看板',
    subtitle: '给老板和管理层快速查看经营摘要、风险、待办与状态快照的地方。',
    icon: 'i-lucide-chart-column-big'
  },
  {
    prefix: '/home',
    label: '主页',
    subtitle: '聊天优先的 Agent 工作台首页，负责发起任务，不假装真实 AI 已经接通。',
    icon: 'i-lucide-house'
  },
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
    subtitle: 'ERP 继续作为正式业务工作台承接 Finance / Procurement / HR；站点新的总入口已切到 /home。',
    icon: 'i-lucide-panels-top-left'
  }
]

const currentSection = computed(() => {
  return routeMeta.find((item) => route.path.startsWith(item.prefix)) ?? {
    prefix: '/',
    label: '主页',
    subtitle: '当前站点以 /home 作为新的聊天优先入口，ERP 正式 owning scope 仍为 Finance / Procurement / HR。',
    icon: 'i-lucide-house'
  }
})

const primaryLinks = computed<NavigationMenuItem[]>(() => [
  {
    label: '主页',
    icon: 'i-lucide-house',
    defaultOpen: true,
    children: [
      { label: 'Agent 首页', icon: 'i-lucide-sparkles', to: '/home' },
      { label: '经营看板', icon: 'i-lucide-chart-column-big', to: '/home/dashboard' },
      { label: '任务工作区', icon: 'i-lucide-layout-dashboard', to: '/home/workspace' }
    ]
  },
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
    id: 'home',
    label: '主页',
    items: [
      { label: 'Agent 首页', icon: 'i-lucide-sparkles', to: '/home' },
      { label: '经营看板', icon: 'i-lucide-chart-column-big', to: '/home/dashboard' },
      { label: '任务工作区', icon: 'i-lucide-layout-dashboard', to: '/home/workspace' }
    ]
  },
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
        <UDashboardSearchButton class="w-full" />
        <UNavigationMenu orientation="vertical" :items="primaryLinks" />
      </div>

      <template #footer>
        <div>
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
