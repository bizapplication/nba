<script setup lang="ts">
import type { HomeAttachment, HomeChatMessage } from '~/types/home'

const route = useRoute()
const { getThread } = useHomeWorkspace()

const runId = computed(() => {
  const value = route.params.id
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const thread = computed(() => {
  return getThread(runId.value)
})

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

function messageTone(role: HomeChatMessage['role']) {
  switch (role) {
    case 'user':
      return 'border-primary/20 bg-primary/6'
    case 'assistant':
      return 'border-default/70 bg-white'
    default:
      return 'border-default/70 bg-default/20'
  }
}

function messageLabel(role: HomeChatMessage['role']) {
  switch (role) {
    case 'user':
      return 'You'
    case 'assistant':
      return 'Agent'
    default:
      return 'System'
  }
}
</script>

<template>
  <div v-if="thread" class="mx-auto flex max-w-7xl flex-col gap-6">
    <section class="rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,251,248,0.95))] p-6 shadow-[0_28px_72px_-48px_rgba(15,23,42,0.42)] sm:p-8">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px] xl:items-start">
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="primary" variant="soft">
              Chat Detail
            </UBadge>
            <HomeRunStatusBadge :status="thread.status" />
          </div>

          <div class="space-y-3">
            <h2 class="text-3xl font-semibold leading-tight text-highlighted sm:text-4xl">
              {{ thread.title }}
            </h2>
            <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
              {{ thread.summary }}
            </p>
          </div>
        </div>

        <UCard variant="subtle" class="rounded-[1.75rem] border border-default/70 bg-white/88">
          <template #header>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-highlighted">
                当前 run 状态
              </p>
              <p class="text-xs leading-6 text-muted">
                这页只展示单条会话详情，仍然是前端 mock 语义。
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4">
              <p class="text-xs uppercase tracking-[0.22em] text-muted">
                模型
              </p>
              <p class="mt-2 text-sm font-semibold text-highlighted">
                {{ thread.model }}
              </p>
            </div>

            <div class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4">
              <p class="text-xs uppercase tracking-[0.22em] text-muted">
                创建时间
              </p>
              <p class="mt-2 text-sm font-semibold text-highlighted">
                {{ thread.createdAt }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <UButton to="/home/workspace" icon="i-lucide-layout-dashboard" color="primary">
                返回工作区
              </UButton>
              <UButton to="/home" icon="i-lucide-sparkles" color="neutral" variant="outline">
                发起新任务
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </section>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_340px]">
      <UCard class="rounded-[1.75rem] border border-default/70">
        <template #header>
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-highlighted">
              对话消息流
            </h3>
            <p class="text-sm leading-6 text-muted">
              当前只展示 mock message 列表，不做流式输出或持久化轮询。
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <div
            v-for="message in thread.messages"
            :key="message.id"
            :class="['rounded-[1.5rem] border px-4 py-4', messageTone(message.role)]"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-highlighted">
                {{ messageLabel(message.role) }}
              </p>
              <p class="text-xs text-muted">
                {{ message.createdAt }}
              </p>
            </div>
            <p class="mt-3 whitespace-pre-line text-sm leading-7 text-toned">
              {{ message.content }}
            </p>
          </div>
        </div>
      </UCard>

      <div class="space-y-4">
        <UCard class="rounded-[1.75rem] border border-default/70">
          <template #header>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-highlighted">
                Prompt 摘要
              </h3>
              <p class="text-sm leading-6 text-muted">
                帮助你快速回忆这条 run 的原始目标。
              </p>
            </div>
          </template>

          <div class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4 text-sm leading-7 text-toned">
            {{ thread.promptPreview }}
          </div>
        </UCard>

        <UCard class="rounded-[1.75rem] border border-default/70">
          <template #header>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-highlighted">
                关联文件
              </h3>
              <p class="text-sm leading-6 text-muted">
                这里展示挂在当前 run 上的 mock 文件列表。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="attachment in thread.attachments"
              :key="attachment.id"
              class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UIcon :name="attachmentIcon(attachment.type)" class="size-5" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-highlighted">
                    {{ attachment.name }}
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    {{ attachment.sizeLabel }}
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
                相关输出概览
              </h3>
              <p class="text-sm leading-6 text-muted">
                当前不生成真实报告，只用稳定假数据表达输出形态。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="output in thread.outputs"
              :key="output.id"
              class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4"
            >
              <p class="text-sm font-semibold text-highlighted">
                {{ output.label }}
              </p>
              <p class="mt-2 text-sm leading-6 text-toned">
                {{ output.description }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>

  <div v-else class="mx-auto max-w-3xl">
    <UCard class="rounded-[2rem] border border-default/70">
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="text-sm font-semibold text-highlighted">
            找不到这条会话
          </p>
          <p class="text-sm leading-6 text-toned">
            当前会话只保存在前端 mock 状态中。如果你刚刷新了页面，之前临时创建的 run 可能已经不在本地状态里。
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <UButton to="/home/workspace" icon="i-lucide-layout-dashboard" color="primary">
            返回工作区
          </UButton>
          <UButton to="/home" icon="i-lucide-sparkles" color="neutral" variant="outline">
            回到主页
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
