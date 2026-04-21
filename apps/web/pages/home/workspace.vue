<script setup lang="ts">
import type { HomeAttachment } from '~/types/home'

const {
  getThread,
  orderedRuns,
  setPrompt,
  workflowShortcuts,
  workspaceChats,
  workspaceFiles,
  workspaceReports
} = useHomeWorkspace()

const latestRun = computed(() => orderedRuns.value[0] ?? null)
const latestThread = computed(() => latestRun.value ? getThread(latestRun.value.id) : null)

function attachmentIcon(type: HomeAttachment['type']) {
  switch (type) {
    case 'sheet':
      return 'i-lucide-sheet'
    case 'image':
      return 'i-lucide-image'
    case 'brief':
      return 'i-lucide-file-pen-line'
    default:
      return 'i-lucide-file-text'
  }
}

function latestAssistantSummary(runId: string) {
  const thread = getThread(runId)
  const message = [...(thread?.messages ?? [])].reverse().find((item) => item.role === 'assistant')
  return message?.content ?? '当前还没有更多输出摘要。'
}

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
              任务工作区是给操作者继续处理 run、历史对话、附件和输出的地方。
            </h2>
            <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
              这里负责承接首页发起后的继续处理。最近任务、历史对话、附件、报告草稿和输出都集中在这里，再按需要进入单条 chat 详情。
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
                首页发起后第一时间回到这里，方便继续处理 run、附件和输出，而不是只看摘要。
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
              {{ latestThread?.promptPreview }}
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
              当前主列表继续围绕 run 组织，不在这里展开完整消息流，方便操作者先决定下一步。
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
            <button
              v-for="workflow in workflowShortcuts"
              :key="workflow.title"
              type="button"
              class="w-full rounded-2xl border border-default/70 bg-default/20 px-4 py-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
              @click="startWorkflow(workflow.prompt)"
            >
              <p class="text-sm font-semibold text-highlighted">
                {{ workflow.title }}
              </p>
              <p class="mt-2 text-sm leading-6 text-toned">
                {{ workflow.description }}
              </p>
            </button>
          </div>
        </UCard>

        <UCard class="rounded-[1.75rem] border border-default/70">
        <template #header>
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-highlighted">
              最近聊天
            </h3>
            <p class="text-sm leading-6 text-muted">
              这里承接历史对话入口，方便继续回到某条 run，而不等同于完整 chat 页面。
            </p>
          </div>
        </template>

          <div class="space-y-3">
            <NuxtLink
              v-for="chat in workspaceChats"
              :key="chat.id"
              :to="`/home/chat/${chat.id}`"
              class="block rounded-2xl border border-default/70 bg-default/20 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-3">
                  <p class="text-sm font-semibold text-highlighted">
                    {{ chat.title }}
                  </p>
                  <HomeRunStatusBadge :status="chat.status" />
                </div>
                <p class="line-clamp-3 text-xs leading-6 text-toned">
                  {{ latestAssistantSummary(chat.id) }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </UCard>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <UCard class="rounded-[1.75rem] border border-default/70">
        <template #header>
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-highlighted">
              最近文件处理
            </h3>
            <p class="text-sm leading-6 text-muted">
              附件只保留在前端状态中，但不同页面共享同一套最小语义。
            </p>
          </div>
        </template>

        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="file in workspaceFiles"
            :key="file.id"
            class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4"
          >
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UIcon :name="attachmentIcon(file.type)" class="size-5" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-highlighted">
                  {{ file.name }}
                </p>
                <p class="mt-1 text-xs text-muted">
                  {{ file.sizeLabel }}
                </p>
                <p class="mt-2 text-xs leading-6 text-toned">
                  来自 {{ file.runTitle }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-[1.75rem] border border-default/70">
        <template #header>
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-highlighted">
              最近报告 / 草稿
            </h3>
            <p class="text-sm leading-6 text-muted">
              输出摘要在 workspace 汇总展示，详细上下文再进入具体会话页。
            </p>
          </div>
        </template>

        <div class="space-y-3">
          <NuxtLink
            v-for="report in workspaceReports"
            :key="report.id"
            :to="`/home/chat/${report.runId}`"
            class="block rounded-2xl border border-default/70 bg-default/20 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-highlighted">
                  {{ report.label }}
                </p>
                <p class="mt-2 text-sm leading-6 text-toned">
                  {{ report.description }}
                </p>
                <p class="mt-2 text-xs text-muted">
                  来源 {{ report.runTitle }}
                </p>
              </div>
              <UIcon name="i-lucide-arrow-up-right" class="mt-1 size-4 shrink-0 text-muted" />
            </div>
          </NuxtLink>
        </div>
      </UCard>
    </div>
  </div>
</template>
