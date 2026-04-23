<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const open = ref(false)
const collapsed = ref(false)

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
        <div class="flex items-center gap-2">
          <TenantsMenu :collapsed="collapsed" />
        </div>
      </template>

      <div class="erp-shell-sidebar-body">
        <UDashboardSearchButton
          :collapsed="collapsed"
          :tooltip="collapsed"
          :class="collapsed ? 'mx-auto' : 'w-full'"
        />
        <UNavigationMenu
          orientation="vertical"
          :items="primaryLinks"
          :collapsed="collapsed"
          popover
          tooltip
          :ui="collapsed ? { link: 'justify-center' } : undefined"
        />
      </div>

      <template #footer>
        <div>
          <UserMenu :collapsed="collapsed" />
        </div>
      </template>
    </UDashboardSidebar>

    <div class="erp-shell-main">
      <main class="erp-shell-body">
        <UButton
          v-if="!open"
          icon="i-lucide-panel-left-open"
          color="neutral"
          variant="soft"
          size="sm"
          square
          class="fixed bottom-4 left-4 z-30 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.4)] lg:hidden"
          aria-label="打开导航栏"
          @click="open = true"
        />
        <slot />
      </main>
    </div>

    <UDashboardSearch :groups="searchGroups" />
    <NotificationsSlideover />
  </UDashboardGroup>
</template>
