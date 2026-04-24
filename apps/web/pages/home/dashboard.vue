<script setup lang="ts">
definePageMeta({
  middleware: 'home-auth'
})

const {
  dashboardMetrics,
  ensureThread,
  orderedRuns,
  pendingActionRequests,
  refreshRuns
} = useHomeWorkspace()

await refreshRuns()

for (const run of orderedRuns.value.slice(0, 6)) {
  await ensureThread(run.id)
}

const businessSignals = computed(() => [
  {
    label: '总运行数',
    value: String(dashboardMetrics.value.totalRuns),
    hint: '当前本地 demo 中已保存的 AI run 数量。'
  },
  {
    label: '待审批动作',
    value: String(dashboardMetrics.value.pendingApprovals),
    hint: '还没放行的文件、命令和浏览器动作都会在这里体现。'
  },
  {
    label: '阻塞 run',
    value: String(dashboardMetrics.value.blockedRuns),
    hint: '通常表示等待审批、被拒绝，或执行阶段出现异常。'
  },
  {
    label: '关联附件',
    value: String(dashboardMetrics.value.attachments),
    hint: '已随 run 保存到本地 demo 工作区的文件数。'
  }
])

const businessKpis = computed(() => [
  {
    label: '已完成 run',
    value: String(dashboardMetrics.value.completedRuns),
    hint: '这类 run 已经形成最终答复，或审批动作已经执行完成。'
  },
  {
    label: '运行中',
    value: String(orderedRuns.value.filter((run) => run.status === 'running').length),
    hint: '最近提交后仍在处理中的任务。'
  },
  {
    label: '待继续处理',
    value: String(orderedRuns.value.filter((run) => run.status === 'blocked').length),
    hint: '通常意味着下一步需要你审批、拒绝或补充追问。'
  },
  {
    label: '最近任务数',
    value: String(orderedRuns.value.length),
    hint: 'demo 当前按本地 SQLite 持久化，刷新页面不会丢失。'
  }
])

const riskAlerts = computed(() => {
  return pendingActionRequests.value.slice(0, 4).map((action) => ({
    title: action.title,
    level: action.kind === 'command' ? 'High' : 'Medium',
    description: `${action.runTitle}：${action.summary}`
  }))
})

const todoRuns = computed(() => {
  return orderedRuns.value.slice(0, 4).map((run) => ({
    title: run.title,
    owner: run.model,
    dueAt: run.createdAt
  }))
})
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
              Real Snapshot
            </UBadge>
          </div>

          <div class="space-y-3">
            <h2 class="text-3xl font-semibold leading-tight text-highlighted sm:text-4xl">
              经营看板是给老板和管理层先扫 demo 当前运行状态、风险和待办的地方。
            </h2>
            <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
              这里展示的不是静态 mock，而是本地 OpenClaw demo 的 run、审批和附件快照，帮助你快速判断当前演示进度和下一步要处理的动作。
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
                右侧优先汇总 run、审批、附件与阻塞状态，用来支持演示判断。
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
              最近运行概览
            </h3>
            <p class="text-sm leading-6 text-muted">
              从这里可以快速回到最近的 run，继续展示真实问答或审批链路。
            </p>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-3">
          <NuxtLink
            v-for="run in orderedRuns.slice(0, 3)"
            :key="run.id"
            :to="`/home/chat/${run.id}`"
            class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
          >
            <p class="text-sm font-semibold text-highlighted">
              {{ run.title }}
            </p>
            <p class="mt-1 text-xs uppercase tracking-[0.18em] text-primary/70">
              {{ run.model }}
            </p>
            <p class="mt-3 text-sm leading-6 text-toned">
              {{ run.summary }}
            </p>
          </NuxtLink>
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
                优先暴露最需要继续确认或放行的动作。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="risk in riskAlerts"
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

            <div v-if="!riskAlerts.length" class="rounded-2xl border border-dashed border-default/70 bg-default/10 px-4 py-6 text-sm leading-6 text-muted">
              当前没有待审批或高优先级风险动作。
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
                保留足够支持管理判断的 run 摘要，不展开执行细节。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="todo in todoRuns"
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
                创建于 {{ todo.dueAt }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
