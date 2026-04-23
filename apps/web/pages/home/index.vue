<script setup lang="ts">
import type { HomeAttachment, HomePromptPreset } from '~/types/home'

const {
  clearDraft,
  currentModel,
  draftAttachments,
  draftPrompt,
  modelOptions,
  orderedRuns,
  promptGroups,
  selectedModel,
  addDraftFiles,
  createMockRun,
  removeDraftAttachment,
  setPrompt,
  setSelectedModel
} = useHomeWorkspace()

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

  createMockRun()
  await navigateTo('/home/workspace')
}
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-8">
    <section class="relative overflow-hidden rounded-[2.5rem] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,252,249,0.94))] px-5 py-8 shadow-[0_32px_80px_-52px_rgba(15,23,42,0.42)] sm:px-8 sm:py-10">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(0,220,130,0.15),transparent_62%)]" />
      <div class="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.16),transparent_66%)] blur-2xl" />

      <div class="relative mx-auto flex max-w-4xl flex-col gap-6 text-center">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <UBadge color="primary" variant="soft">
            Chat-first Home
          </UBadge>
          <UBadge color="neutral" variant="outline">
            UI-only
          </UBadge>
        </div>

        <div class="space-y-3">
          <h2 class="text-3xl font-semibold leading-tight text-highlighted sm:text-5xl">
            今天想让 Agent 帮你处理什么？
          </h2>
          <p class="mx-auto max-w-2xl text-sm leading-7 text-toned sm:text-base">
            直接开聊就好。你可以先输入问题，顺手挂上文件，选一个模型，然后把这次对话送进工作区继续追踪。
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-2">
          <UButton to="/home/workspace" icon="i-lucide-layout-dashboard" color="neutral" variant="ghost" size="sm">
            任务工作区
          </UButton>
          <UButton to="/home/dashboard" icon="i-lucide-chart-column-big" color="neutral" variant="ghost" size="sm">
            经营看板
          </UButton>
        </div>

        <p class="mx-auto max-w-3xl text-xs leading-6 text-muted">
          `任务工作区` 用来继续处理 run、历史对话、附件和输出；`经营看板` 用来给老板和管理层快速看经营摘要、风险与待办。
        </p>

        <div class="rounded-[2rem] border border-default/70 bg-white/92 p-4 text-left shadow-[0_30px_80px_-48px_rgba(15,23,42,0.48)] backdrop-blur sm:p-5">
          <div class="space-y-4">
            <UTextarea
              v-model="draftPrompt"
              :rows="8"
              autoresize
              size="xl"
              variant="ghost"
              placeholder="例如：请结合我即将上传的资料，整理一版给老板汇报的风险摘要、建议动作和跨部门待办。"
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
                    {{ draftAttachments.length ? `已附 ${draftAttachments.length} 份文件` : '可附 PDF、表格、图像或说明文件' }}
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
                  提交后会创建一条 mock run，并带你进入 `workspace` 继续处理 run、附件和输出。
                </p>
                <UButton
                  icon="i-lucide-arrow-up-right"
                  color="primary"
                  size="xl"
                  :disabled="!canSubmit"
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
              不必先理解平台结构，点一句就能开始。
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
    </section>

    <section class="mx-auto w-full max-w-4xl rounded-[2rem] border border-default/70 bg-white/88 p-4 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.35)] sm:p-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="space-y-1">
          <p class="text-sm font-semibold text-highlighted">
            继续最近对话
          </p>
          <p class="text-xs leading-6 text-muted">
            首页保留历史对话入口，但只做轻量预览，不展开成 `workspace` 缩小版。
          </p>
        </div>

        <UButton to="/home/workspace" color="neutral" variant="ghost" size="sm" icon="i-lucide-arrow-right">
          查看全部历史
        </UButton>
      </div>

      <div class="mt-4 space-y-2">
        <NuxtLink
          v-for="run in recentRuns"
          :key="run.id"
          :to="`/home/chat/${run.id}`"
          class="group flex items-start justify-between gap-4 rounded-[1.25rem] border border-default/70 bg-default/20 px-4 py-3 transition hover:border-primary/30 hover:bg-primary/5"
        >
          <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate text-sm font-semibold text-highlighted">
                {{ run.title }}
              </p>
              <span class="text-[11px] text-muted">
                {{ run.createdAt }}
              </span>
            </div>
            <p class="line-clamp-1 text-xs leading-6 text-toned">
              {{ run.promptPreview }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <HomeRunStatusBadge :status="run.status" />
            <UIcon name="i-lucide-arrow-up-right" class="mt-0.5 size-4 text-muted transition group-hover:text-primary" />
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
