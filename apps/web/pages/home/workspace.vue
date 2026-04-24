<script setup lang="ts">
definePageMeta({
  middleware: 'home-auth'
})

const {
  ensureThread,
  orderedRuns,
  pendingActionRequests,
  promptGroups,
  refreshRuns,
  setPrompt
} = useHomeWorkspace()

await refreshRuns()

for (const run of orderedRuns.value.slice(0, 4)) {
  await ensureThread(run.id)
}

const latestRun = computed(() => orderedRuns.value[0] ?? null)

async function startWorkflow(prompt: string) {
  setPrompt(prompt)
  await navigateTo('/home')
}
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6">
    <section class="rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,251,248,0.94))] p-6 shadow-[0_28px_72px_-48px_rgba(15,23,42,0.42)] sm:p-8">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px] xl:items-start">
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="primary" variant="soft">
              Workspace
            </UBadge>
            <UBadge color="neutral" variant="outline">
              Run-centered
            </UBadge>
          </div>

          <div class="space-y-3">
            <h2 class="text-3xl font-semibold leading-tight text-highlighted sm:text-4xl">
              任务工作区是给操作者继续处理 run、审批卡、历史对话和附件的地方。
            </h2>
            <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
              这里承接首页发起后的继续处理。最近任务和待审批动作都会先汇总在这里，方便你快速判断下一步是继续追问、放行动作，还是回到首页发起新任务。
            </p>
          </div>
        </div>

        <UCard variant="subtle" class="rounded-[1.75rem] border border-default/70 bg-white/88">
          <template #header>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-highlighted">
                继续处理当前 run
              </p>
              <p class="text-xs leading-6 text-muted">
                最近一条 run 的摘要会显示在这里，方便你直接跳回会话页。
              </p>
            </div>
          </template>

          <div v-if="latestRun" class="space-y-4">
            <div class="space-y-2">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-base font-semibold text-highlighted">
                    {{ latestRun.title }}
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    {{ latestRun.createdAt }} · {{ latestRun.model }}
                  </p>
                </div>
                <HomeRunStatusBadge :status="latestRun.status" />
              </div>
              <p class="text-sm leading-6 text-toned">
                {{ latestRun.summary }}
              </p>
            </div>

            <div class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4 text-sm leading-6 text-toned">
              {{ latestRun.promptPreview }}
            </div>

            <div class="flex flex-wrap gap-3">
              <UButton :to="`/home/chat/${latestRun.id}`" icon="i-lucide-messages-square" color="primary">
                打开会话
              </UButton>
              <UButton to="/home" icon="i-lucide-sparkles" color="neutral" variant="outline">
                新建 run
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </section>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_340px]">
      <UCard class="rounded-[1.75rem] border border-default/70">
        <template #header>
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-highlighted">
              最近任务 / 最近 run
            </h3>
            <p class="text-sm leading-6 text-muted">
              主列表围绕真实 run 组织，打开后会看到消息流、附件和审批动作。
            </p>
          </div>
        </template>

        <div class="space-y-3">
          <NuxtLink
            v-for="run in orderedRuns"
            :key="run.id"
            :to="`/home/chat/${run.id}`"
            class="group block rounded-2xl border border-default/70 bg-default/20 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
          >
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-base font-semibold text-highlighted">
                    {{ run.title }}
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    {{ run.createdAt }} · {{ run.model }} · {{ run.attachmentCount }} 份附件
                  </p>
                </div>
                <HomeRunStatusBadge :status="run.status" />
              </div>

              <p class="text-sm leading-6 text-toned">
                {{ run.summary }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </UCard>

      <div class="space-y-4">
        <UCard class="rounded-[1.75rem] border border-default/70">
          <template #header>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-highlighted">
                常用工作流入口
              </h3>
              <p class="text-sm leading-6 text-muted">
                点击后会把 prompt 带回首页，继续从聊天优先入口发起。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="group in promptGroups"
              :key="group.title"
              class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4"
            >
              <p class="text-sm font-semibold text-highlighted">
                {{ group.title }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <UButton
                  v-for="preset in group.presets"
                  :key="preset.id"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  @click="startWorkflow(preset.prompt)"
                >
                  {{ preset.label }}
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="rounded-[1.75rem] border border-default/70">
          <template #header>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-highlighted">
                待审批动作
              </h3>
              <p class="text-sm leading-6 text-muted">
                文件修改、命令执行和浏览器自动化会先汇总到这里，只有审批通过才会继续执行。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="action in pendingActionRequests"
              :key="action.id"
              class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4"
            >
              <p class="text-sm font-semibold text-highlighted">
                {{ action.title }}
              </p>
              <p class="mt-2 text-sm leading-6 text-toned">
                {{ action.summary }}
              </p>
              <p class="mt-2 text-xs text-muted">
                来源 {{ action.runTitle }}
              </p>
              <div class="mt-3">
                <UButton :to="`/home/chat/${action.runId}`" color="primary" size="sm">
                  打开会话
                </UButton>
              </div>
            </div>

            <div v-if="!pendingActionRequests.length" class="rounded-2xl border border-dashed border-default/70 bg-default/10 px-4 py-6 text-sm leading-6 text-muted">
              当前没有待审批动作。
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
