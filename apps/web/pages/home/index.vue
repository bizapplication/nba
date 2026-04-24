<script setup lang="ts">
import type { HomeAttachment, HomePromptPreset } from '~/types/home'

definePageMeta({
  middleware: 'home-auth'
})

const auth = useDemoAuth()
const {
  clearDraft,
  currentModel,
  draftAttachments,
  draftPrompt,
  isSubmittingRun,
  modelOptions,
  orderedRuns,
  promptGroups,
  selectedModel,
  addDraftFiles,
  createRunFromDraft,
  refreshRuns,
  removeDraftAttachment,
  setPrompt,
  setSelectedModel
} = useHomeWorkspace()

await auth.fetchCurrentUser()
await refreshRuns()

const fileInput = ref<HTMLInputElement | null>(null)

const recentRuns = computed(() => orderedRuns.value.slice(0, 4))
const canSubmit = computed(() => draftPrompt.value.trim().length > 0 || draftAttachments.value.length > 0)

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

function openFilePicker() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement

  if (!target.files?.length) {
    return
  }

  addDraftFiles(target.files)
  target.value = ''
}

function applyPreset(preset: HomePromptPreset) {
  setPrompt(preset.prompt)
}

async function submitPrompt() {
  if (!canSubmit.value) {
    return
  }

  const thread = await createRunFromDraft()
  await navigateTo(`/home/chat/${thread.id}`)
}

async function logout() {
  await auth.logout()
  await navigateTo('/auth/login')
}
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-8">
    <section class="relative overflow-hidden rounded-[2.5rem] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,252,249,0.94))] px-5 py-8 shadow-[0_32px_80px_-52px_rgba(15,23,42,0.42)] sm:px-8 sm:py-10">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(0,220,130,0.15),transparent_62%)]" />
      <div class="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.16),transparent_66%)] blur-2xl" />

      <div class="relative grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_340px]">
        <div class="space-y-6">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="primary" variant="soft">
              OpenClaw Connected
            </UBadge>
            <UBadge color="neutral" variant="outline">
              Local Demo
            </UBadge>
            <div class="ml-auto flex flex-wrap items-center gap-2">
              <UButton to="/home/workspace" icon="i-lucide-layout-dashboard" color="neutral" variant="ghost" size="sm">
                任务工作区
              </UButton>
              <UButton to="/home/dashboard" icon="i-lucide-chart-column-big" color="neutral" variant="ghost" size="sm">
                经营看板
              </UButton>
              <UButton icon="i-lucide-log-out" color="neutral" variant="ghost" size="sm" @click="logout">
                退出
              </UButton>
            </div>
          </div>

          <div class="space-y-3">
            <h2 class="text-3xl font-semibold leading-tight text-highlighted sm:text-5xl">
              今天想让本地 Agent 帮你处理什么？
            </h2>
            <p class="max-w-3xl text-sm leading-7 text-toned sm:text-base">
              这里已经接上真实的 Platform、Agent API、CRM、ERP 和 OpenClaw sidecar。只读问题会先查真实业务数据；涉及文件、命令和浏览器动作时，会先生成审批卡再继续执行。
            </p>
          </div>

          <div class="rounded-[2rem] border border-default/70 bg-white/92 p-4 text-left shadow-[0_30px_80px_-48px_rgba(15,23,42,0.48)] backdrop-blur sm:p-5">
            <div class="space-y-4">
              <UTextarea
                v-model="draftPrompt"
                :rows="8"
                autoresize
                size="xl"
                variant="ghost"
                placeholder="例如：请读取当前 CRM 的客户、商机和订单数据，帮我整理一个适合业务负责人看的概览。"
                class="w-full rounded-[1.5rem] border border-default/70 bg-default/20 px-2 py-2"
              />

              <input
                ref="fileInput"
                type="file"
                multiple
                class="hidden"
                @change="onFileChange"
              >

              <div v-if="draftAttachments.length" class="flex flex-wrap gap-2">
                <div
                  v-for="attachment in draftAttachments"
                  :key="attachment.id"
                  class="flex items-center gap-2 rounded-full border border-default/70 bg-default/20 px-3 py-2"
                >
                  <UIcon :name="attachmentIcon(attachment.type)" class="size-4 text-primary" />
                  <span class="max-w-44 truncate text-xs font-medium text-highlighted">
                    {{ attachment.name }}
                  </span>
                  <span class="text-[11px] text-muted">
                    {{ attachment.sizeLabel }}
                  </span>
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="removeDraftAttachment(attachment.id)"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-4 rounded-[1.5rem] border border-default/70 bg-default/20 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
                <div class="flex min-w-0 flex-1 flex-col gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <UButton icon="i-lucide-paperclip" color="neutral" variant="soft" size="sm" @click="openFilePicker">
                      添加文件
                    </UButton>
                    <UButton
                      v-if="draftAttachments.length"
                      icon="i-lucide-trash-2"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      @click="clearDraft"
                    >
                      清空输入
                    </UButton>
                    <span class="text-xs leading-6 text-muted">
                      {{ draftAttachments.length ? `已附 ${draftAttachments.length} 份文件` : '上传的文件会落到 demo-files/uploads，并跟随当前 run 保存。' }}
                    </span>
                  </div>

                  <div class="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
                    <USelect
                      v-model="selectedModel"
                      :items="modelOptions"
                      value-key="value"
                      label-key="label"
                      placeholder="选择模型"
                      @update:model-value="setSelectedModel"
                    />
                    <p class="text-xs leading-6 text-toned">
                      <span class="font-semibold text-highlighted">{{ currentModel.label }}</span>
                      {{ currentModel.note }}
                    </p>
                  </div>
                </div>

                <div class="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <p class="text-xs leading-6 text-muted sm:max-w-44">
                    提交后会创建真实 run，并进入会话页查看消息、附件和审批动作。
                  </p>
                  <UButton
                    icon="i-lucide-arrow-up-right"
                    color="primary"
                    size="xl"
                    :disabled="!canSubmit"
                    :loading="isSubmittingRun"
                    @click="submitPrompt"
                  >
                    发起对话
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4 text-left">
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
                Quick Starts
              </p>
              <p class="text-sm leading-6 text-muted">
                直接复用预设，让 demo 更快进入“真实问答”或“审批动作”。
              </p>
            </div>

            <div class="space-y-3">
              <div
                v-for="group in promptGroups"
                :key="group.title"
                class="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <p class="min-w-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted sm:w-24">
                  {{ group.title }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="preset in group.presets"
                    :key="preset.id"
                    color="neutral"
                    variant="soft"
                    size="sm"
                    class="rounded-full"
                    @click="applyPreset(preset)"
                  >
                    {{ preset.label }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <UCard class="rounded-[2rem] border border-default/70 bg-white/88">
          <template #header>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-highlighted">
                当前登录
              </p>
              <p class="text-xs leading-6 text-muted">
                账号来自本地 Platform SQLite。
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="rounded-2xl border border-default/70 bg-default/20 px-4 py-4">
              <p class="text-sm font-semibold text-highlighted">
                {{ auth.currentUser.value?.name }}
              </p>
              <p class="mt-2 text-xs text-muted">
                {{ auth.currentUser.value?.email }}
              </p>
            </div>

            <div class="space-y-3">
              <p class="text-sm font-semibold text-highlighted">
                最近运行
              </p>
              <NuxtLink
                v-for="run in recentRuns"
                :key="run.id"
                :to="`/home/chat/${run.id}`"
                class="block rounded-2xl border border-default/70 bg-default/20 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-highlighted">
                      {{ run.title }}
                    </p>
                    <p class="mt-1 text-xs text-muted">
                      {{ run.createdAt }} · {{ run.attachmentCount }} 份附件
                    </p>
                  </div>
                  <HomeRunStatusBadge :status="run.status" />
                </div>
                <p class="mt-3 line-clamp-3 text-sm leading-6 text-toned">
                  {{ run.summary }}
                </p>
              </NuxtLink>
            </div>
          </div>
        </UCard>
      </div>
    </section>
  </div>
</template>
