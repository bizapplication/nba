<script setup lang="ts">
import type { HomeAttachment, HomeChatMessage, HomeActionRequest } from '~/types/home'

definePageMeta({
  middleware: 'home-auth'
})

const route = useRoute()
const {
  approveAction,
  ensureThread,
  rejectAction,
  sendMessage
} = useHomeWorkspace()

const runId = computed(() => {
  const value = route.params.id
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const thread = ref<Awaited<ReturnType<typeof ensureThread>> | null>(null)
const followupPrompt = ref('')
const followupFiles = ref<File[]>([])
const followupInput = ref<HTMLInputElement | null>(null)
const actionPendingId = ref('')

thread.value = await ensureThread(runId.value)

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

function actionTone(action: HomeActionRequest) {
  if (action.status === 'completed') {
    return 'border-success/20 bg-success/5'
  }

  if (action.status === 'failed' || action.status === 'rejected') {
    return 'border-error/20 bg-error/5'
  }

  return 'border-warning/20 bg-warning/5'
}

function openFollowupPicker() {
  followupInput.value?.click()
}

function onFollowupFiles(event: Event) {
  const target = event.target as HTMLInputElement

  if (!target.files?.length) {
    return
  }

  followupFiles.value = [...followupFiles.value, ...Array.from(target.files)]
  target.value = ''
}

async function submitFollowup() {
  if (!thread.value || !followupPrompt.value.trim()) {
    return
  }

  thread.value = await sendMessage(thread.value.id, followupPrompt.value, followupFiles.value)
  followupPrompt.value = ''
  followupFiles.value = []
}

async function approve(requestId: string) {
  if (!thread.value) {
    return
  }

  actionPendingId.value = requestId

  try {
    thread.value = await approveAction(thread.value.id, requestId)
  } finally {
    actionPendingId.value = ''
  }
}

async function reject(requestId: string) {
  if (!thread.value) {
    return
  }

  actionPendingId.value = requestId

  try {
    thread.value = await rejectAction(thread.value.id, requestId)
  } finally {
    actionPendingId.value = ''
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
                这页会展示真实消息流、审批动作和附件。
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
                附件
              </p>
              <p class="mt-2 text-sm font-semibold text-highlighted">
                {{ thread.attachmentCount }} 份
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
              只读阶段会直接返回答复；文件、命令、浏览器动作会先转成审批卡。
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

        <div class="mt-6 space-y-4 rounded-[1.5rem] border border-default/70 bg-default/20 px-4 py-4">
          <div class="space-y-2">
            <p class="text-sm font-semibold text-highlighted">
              继续追问
            </p>
            <p class="text-xs leading-6 text-muted">
              继续走只读链路；如果涉及文件、命令或浏览器动作，会再次生成审批请求。
            </p>
          </div>

          <UTextarea
            v-model="followupPrompt"
            :rows="4"
            autoresize
            placeholder="继续追问，或要求生成新的审批动作。"
          />

          <input
            ref="followupInput"
            type="file"
            multiple
            class="hidden"
            @change="onFollowupFiles"
          >

          <div v-if="followupFiles.length" class="flex flex-wrap gap-2">
            <div
              v-for="file in followupFiles"
              :key="`${file.name}-${file.size}-${file.lastModified}`"
              class="rounded-full border border-default/70 bg-white/80 px-3 py-2 text-xs text-toned"
            >
              {{ file.name }}
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton color="neutral" variant="soft" icon="i-lucide-paperclip" @click="openFollowupPicker">
              添加文件
            </UButton>
            <UButton color="primary" icon="i-lucide-arrow-up-right" @click="submitFollowup">
              发送追问
            </UButton>
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
                审批动作
              </h3>
              <p class="text-sm leading-6 text-muted">
                文件修改、命令执行、浏览器自动化都会先出现在这里，只有审批通过才会继续执行。
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="action in thread.actionRequests"
              :key="action.id"
              :class="['rounded-2xl border px-4 py-4', actionTone(action)]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-highlighted">
                    {{ action.title }}
                  </p>
                  <p class="mt-2 text-sm leading-6 text-toned">
                    {{ action.summary }}
                  </p>
                  <p v-if="action.target" class="mt-2 text-xs text-muted">
                    目标 {{ action.target }}
                  </p>
                  <p v-if="action.resultSummary" class="mt-2 text-xs leading-6 text-toned">
                    {{ action.resultSummary }}
                  </p>
                  <p v-if="action.errorMessage" class="mt-2 text-xs leading-6 text-error">
                    {{ action.errorMessage }}
                  </p>
                </div>
                <UBadge color="neutral" variant="subtle">
                  {{ action.status }}
                </UBadge>
              </div>

              <div v-if="action.status === 'pending'" class="mt-4 flex flex-wrap gap-3">
                <UButton
                  color="primary"
                  size="sm"
                  :loading="actionPendingId === action.id"
                  @click="approve(action.id)"
                >
                  审批并执行
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  size="sm"
                  :loading="actionPendingId === action.id"
                  @click="reject(action.id)"
                >
                  拒绝
                </UButton>
              </div>
            </div>

            <div v-if="!thread.actionRequests.length" class="rounded-2xl border border-dashed border-default/70 bg-default/10 px-4 py-6 text-sm leading-6 text-muted">
              当前还没有审批动作。
            </div>
          </div>
        </UCard>

        <UCard class="rounded-[1.75rem] border border-default/70">
          <template #header>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-highlighted">
                关联文件
              </h3>
              <p class="text-sm leading-6 text-muted">
                文件会保存在本地 `demo-files/uploads`，并跟随当前 run 展示。
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

            <div v-if="!thread.attachments.length" class="rounded-2xl border border-dashed border-default/70 bg-default/10 px-4 py-6 text-sm leading-6 text-muted">
              当前 run 没有附件。
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
            这条 run 可能不存在，或者当前缓存尚未加载完成。
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
