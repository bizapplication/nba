<script setup lang="ts">
const api = useProcurementApi()

const loading = ref(true)
const errorMessage = ref('')
const stats = reactive({
  productTotal: 0,
  activeVendorTotal: 0,
  orderedPurchaseOrderTotal: 0,
  receivedGoodsReceiptTotal: 0,
  draftInvoiceTotal: 0,
  executedPaymentTotal: 0
})

const summaryCards = computed(() => [
  { label: '商品 / 物料', value: stats.productTotal, hint: '采购主数据', icon: 'i-lucide-package-2' },
  { label: '启用供应商', value: stats.activeVendorTotal, hint: '当前可合作主体', icon: 'i-lucide-handshake' },
  { label: '已下单采购单', value: stats.orderedPurchaseOrderTotal, hint: '进入履约过程的订单', icon: 'i-lucide-file-text' },
  { label: '已收货记录', value: stats.receivedGoodsReceiptTotal, hint: '完成到货登记', icon: 'i-lucide-truck' },
  { label: '待执行发票', value: stats.draftInvoiceTotal, hint: '准备驱动付款与财务结果', icon: 'i-lucide-receipt-text' },
  { label: '已执行付款', value: stats.executedPaymentTotal, hint: '已经回流 finance', icon: 'i-lucide-wallet-cards' }
])

const quickActions = [
  { title: '维护供应商与账户', description: '先把供应商主体和收款账户准备好，再进入采购业务。', to: '/erp/procurement/vendors', icon: 'i-lucide-landmark' },
  { title: '推进采购单据', description: '采购订单、收货记录和发票承接采购闭环的主要状态。', to: '/erp/procurement/purchase-orders', icon: 'i-lucide-clipboard-list' },
  { title: '查看付款结果', description: '付款单执行后会继续复用 finance 交易结果层。', to: '/erp/procurement/payments', icon: 'i-lucide-arrow-right-left' }
]

const flowSteps = [
  '供应商与商品先定义采购主数据。',
  '采购订单记录采购意图与金额。',
  '收货记录沉淀履约状态。',
  '供应商发票驱动付款并校验费用账户语义。',
  '付款结果最终回流到 finance 交易页。'
]

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [products, activeVendors, orderedPurchaseOrders, receivedGoodsReceipts, draftInvoices, executedPayments] = await Promise.all([
      api.listProducts({ page: 1, limit: 1 }),
      api.listVendors({ page: 1, limit: 1, status: 'active' }),
      api.listPurchaseOrders({ page: 1, limit: 1, status: 'ORDERED' }),
      api.listGoodsReceipts({ page: 1, limit: 1, status: 'RECEIVED' }),
      api.listVendorInvoices({ page: 1, limit: 1, status: 'DRAFT' }),
      api.listPayments({ page: 1, limit: 1, status: 'EXECUTED' })
    ])

    stats.productTotal = products.total
    stats.activeVendorTotal = activeVendors.total
    stats.orderedPurchaseOrderTotal = orderedPurchaseOrders.total
    stats.receivedGoodsReceiptTotal = receivedGoodsReceipts.total
    stats.draftInvoiceTotal = draftInvoices.total
    stats.executedPaymentTotal = executedPayments.total
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
            <p class="text-base font-semibold text-highlighted">采购管理</p>
            <p class="text-sm text-muted">Procurement 最小采购闭环工作台</p>
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
                <UBadge color="primary" variant="soft">Procurement Dashboard</UBadge>
                <UBadge color="neutral" variant="outline">采购最小闭环</UBadge>
              </div>
              <div class="space-y-2">
                <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
                  先打通供应商、订单、收货、发票和付款，再把结果统一回流财务。
                </h2>
                <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
                  当前 Procurement 不提前扩成完整库存或成本系统，而是先把采购单据主链路打通，让老板能看到从业务单据到财务结果层的最小可运行闭环。
                </p>
              </div>
            </div>

            <UCard variant="subtle" class="rounded-3xl border border-default/70">
              <template #header>
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-highlighted">当前设计重点</p>
                  <p class="text-xs leading-6 text-muted">供应商发票页现在只允许选择费用类账户作为费用账户，前后端都已经收口。</p>
                </div>
              </template>

              <div class="space-y-3 text-sm leading-7 text-toned">
                <p>采购单和收货单主要表达业务状态，不直接生成财务交易。</p>
                <p>真正驱动付款与财务结果的是供应商发票和付款单，这样能用最小模型保持采购语义清楚。</p>
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
                <p class="text-sm leading-6 text-muted">
                  从老板视角看采购模块，先看主数据，再看单据推进，最后看付款结果最清楚。
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
                <h3 class="text-lg font-semibold text-highlighted">采购闭环路径</h3>
                <p class="text-sm leading-6 text-muted">当前 Procurement 首页不只是目录，而是帮助老板快速理解单据是怎么流动的。</p>
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
