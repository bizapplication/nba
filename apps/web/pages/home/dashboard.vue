<script setup lang="ts">
const { dashboardRiskAlerts, dashboardTodos, dashboardTrend } = useHomeWorkspace()

const businessSignals = [
  {
    label: '本周付款压力',
    value: '高',
    hint: '两笔高金额供应商付款需要在周五前确认排程。'
  },
  {
    label: '关账差异提醒',
    value: '2 项',
    hint: '差异主要集中在业务时间与过账时间的口径对齐。'
  },
  {
    label: '高优先级风险',
    value: '3 项',
    hint: '涉及付款安排、报销资料缺口和现金排程。'
  },
  {
    label: '待管理层拍板',
    value: '2 项',
    hint: '需要明确付款优先级与月底资源安排。'
  }
]

const businessKpis = [
  {
    label: '财务摘要',
    value: '差异收口中',
    hint: '当前重点是关账差异核对、资金位置确认和结果层口径统一。'
  },
  {
    label: '采购付款',
    value: '2 笔紧急',
    hint: '优先处理高金额供应商付款，避免影响下周收货与交付。'
  },
  {
    label: '报销执行',
    value: '5 单待处理',
    hint: '重点关注资料完整度、付款准备和月底执行节奏。'
  },
  {
    label: '管理待办',
    value: '7 项',
    hint: '跨 Finance / Procurement / HR 的协同事项已进入收口排期。'
  }
]

const domainBoards = [
  {
    title: 'Finance',
    note: '财务摘要与关账提醒',
    description: '优先让管理层看到差异、资金位置和需要财务继续核对的关键节点。'
  },
  {
    title: 'Procurement',
    note: '付款节奏与订单依赖',
    description: '先暴露付款压力、供应商影响和近期需要管理层拍板的采购节点。'
  },
  {
    title: 'HR',
    note: '报销执行与资料完整度',
    description: '重点提示资料缺口、执行节奏和哪些组织侧待办会拖慢当前闭环。'
  }
]
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6">
    <section class="rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,252,248,0.95))] p-6 shadow-[0_28px_72px_-48px_rgba(15,23,42,0.42)] sm:p-8">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px] xl:items-start">
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="primary" variant="soft">
              Dashboard
            </UBadge>
            <UBadge color="neutral" variant="outline">
              Mock Snapshot
            </UBadge>
          </div>

          <div class="space-y-3">
            <h2 class="text-3xl font-semibold leading-tight text-highlighted sm:text-4xl">
              经营看板是给老板和管理层先扫业务状态、风险和待办的地方。
            </h2>
            <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
              这里集中展示财务摘要、付款压力、风险预警和待办快照，帮助管理层先判断哪里需要继续深入，再进入具体业务页做确认。
            </p>
          </div>
        </div>

        <UCard variant="subtle" class="rounded-[1.75rem] border border-default/70 bg-white/88">
          <template #header>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-highlighted">
                业务状态信号
              </p>
              <p class="text-xs leading-6 text-muted">
                右侧优先放付款压力、关账提醒、高优先级风险和待决策事项，用来支持管理判断。
              </p>
            </div>
          </template>

          <div class="grid gap-3">
            <div
              v-for="signal in businessSignals"
              :key="signal.label"
              class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4"
            >
              <p class="text-xs uppercase tracking-[0.22em] text-muted">
                {{ signal.label }}
              </p>
              <p class="mt-2 text-lg font-semibold text-highlighted">
                {{ signal.value }}
              </p>
              <p class="mt-2 text-xs leading-6 text-toned">
                {{ signal.hint }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </section>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <UCard
        v-for="kpi in businessKpis"
        :key="kpi.label"
        class="rounded-[1.5rem] border border-default/70"
      >
        <div class="space-y-3">
          <p class="text-sm text-muted">
            {{ kpi.label }}
          </p>
          <p class="text-3xl font-semibold text-highlighted">
            {{ kpi.value }}
          </p>
          <p class="text-xs leading-6 text-toned">
            {{ kpi.hint }}
          </p>
        </div>
      </UCard>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
      <UCard class="rounded-[1.75rem] border border-default/70">
        <template #header>
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-highlighted">
              经营脉冲
            </h3>
            <p class="text-sm leading-6 text-muted">
              用稳定 mock 数据表达管理层需要先扫一眼的经营变化，不接真实 ERP 聚合接口。
            </p>
          </div>
        </template>

        <div class="space-y-6">
          <div class="flex items-end gap-3 rounded-[1.5rem] border border-default/70 bg-default/20 px-4 py-6">
            <div
              v-for="point in dashboardTrend"
              :key="point.label"
              class="flex min-w-0 flex-1 flex-col items-center gap-3"
            >
              <div class="flex h-48 w-full items-end rounded-full bg-white/80 px-2 py-2">
                <div
                  class="w-full rounded-full bg-[linear-gradient(180deg,rgba(0,220,130,0.9),rgba(14,165,233,0.72))]"
                  :style="{ height: `${point.value}%` }"
                />
              </div>
              <div class="text-center">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {{ point.label }}
                </p>
                <p class="mt-1 text-sm font-semibold text-highlighted">
                  {{ point.value }}
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div
              v-for="board in domainBoards"
              :key="board.title"
              class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4"
            >
              <p class="text-sm font-semibold text-highlighted">
                {{ board.title }}
              </p>
              <p class="mt-1 text-xs uppercase tracking-[0.18em] text-primary/70">
                {{ board.note }}
              </p>
              <p class="mt-3 text-sm leading-6 text-toned">
                {{ board.description }}
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <div class="space-y-4">
        <UCard class="rounded-[1.75rem] border border-default/70">
          <template #header>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-highlighted">
                风险预警
              </h3>
              <p class="text-sm leading-6 text-muted">
                优先暴露最需要管理侧和业务侧尽快处理的经营风险。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="risk in dashboardRiskAlerts"
              :key="risk.title"
              class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-highlighted">
                  {{ risk.title }}
                </p>
                <UBadge color="warning" variant="subtle">
                  {{ risk.level }}
                </UBadge>
              </div>
              <p class="mt-3 text-sm leading-6 text-toned">
                {{ risk.description }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard class="rounded-[1.75rem] border border-default/70">
          <template #header>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-highlighted">
                待办摘要
              </h3>
              <p class="text-sm leading-6 text-muted">
                只保留足够支持管理判断的待办摘要，不展开执行过程细节。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="todo in dashboardTodos"
              :key="todo.title"
              class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4"
            >
              <p class="text-sm font-semibold text-highlighted">
                {{ todo.title }}
              </p>
              <p class="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                {{ todo.owner }}
              </p>
              <p class="mt-2 text-sm text-toned">
                截止 {{ todo.dueAt }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
