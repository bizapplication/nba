<script setup lang="ts">
import type { HomeAttachment, HomePromptPreset } from '~/types/home'

const props = withDefaults(defineProps<{
  mode?: 'centered' | 'docked'
  submitLabel?: string
}>(), {
  mode: 'centered',
  submitLabel: '发送'
})

const emit = defineEmits<{
  submit: []
}>()

const {
  addDraftFiles,
  draftAttachments,
  draftPrompt,
  promptGroups,
  removeDraftAttachment,
  setPrompt,
} = useHomeWorkspace()

const fileInput = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => draftPrompt.value.trim().length > 0 || draftAttachments.value.length > 0)
const textareaRows = computed(() => props.mode === 'centered' ? 4 : 1)
const boxClass = computed(() => {
  if (props.mode === 'centered') {
    return 'rounded-[2rem] border border-default/70 bg-white/94 p-4 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.48)] sm:p-5'
  }

  return 'rounded-[1.5rem] border border-default/70 bg-white/96 p-3 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.24)]'
})
const quickPresets = computed(() => {
  return promptGroups.flatMap((group) => group.presets.map((preset) => ({
    ...preset,
    shortcutLabel: `${group.title} · ${preset.label}`
  })))
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

function handleKeydown(event: KeyboardEvent) {
  if (
    event.key !== 'Enter'
    || event.shiftKey
    || event.metaKey
    || event.ctrlKey
    || event.altKey
    || event.isComposing
  ) {
    return
  }

  event.preventDefault()
  handleSubmit()
}

function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  emit('submit')
}
</script>

<template>
  <div :class="props.mode === 'centered' ? 'space-y-5' : 'space-y-3'">
    <div :class="boxClass">
      <div class="space-y-3">
        <UTextarea
          v-model="draftPrompt"
          :rows="textareaRows"
          autoresize
          :size="props.mode === 'centered' ? 'xl' : 'lg'"
          variant="ghost"
          :placeholder="props.mode === 'centered'
            ? '例如：请结合我即将上传的资料，整理一版给老板汇报的风险摘要和建议动作。'
            : '继续补充问题，或结合刚上传的资料继续追问。'"
          class="w-full rounded-[1.25rem] border border-default/70 bg-default/20 px-3 py-2"
          @keydown="handleKeydown"
        />

        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="onFileChange"
        >

        <div v-if="draftAttachments.length" class="flex gap-2 overflow-x-auto pb-1">
          <div
            v-for="attachment in draftAttachments"
            :key="attachment.id"
            class="flex shrink-0 items-center gap-2 rounded-full border border-default/70 bg-default/20 px-3 py-2"
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

        <div class="flex items-end gap-2 rounded-[1.5rem] border border-default/70 bg-default/20 px-3 py-3">
          <UButton
            icon="i-lucide-paperclip"
            color="neutral"
            variant="soft"
            size="sm"
            square
            aria-label="添加文件"
            @click="openFilePicker"
          />
          <div class="min-w-0 flex-1 pb-1 text-xs leading-6 text-muted">
            {{ draftAttachments.length ? `已附 ${draftAttachments.length} 份文件` : '可附文件' }}
          </div>
          <div class="shrink-0">
            <UButton
              icon="i-lucide-arrow-up"
              color="primary"
              size="lg"
              square
              :disabled="!canSubmit"
              :aria-label="props.submitLabel"
              @click="handleSubmit"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto pb-1">
      <div class="flex min-w-max gap-2">
        <UButton
          v-for="preset in quickPresets"
          :key="preset.id"
          color="neutral"
          variant="soft"
          size="sm"
          class="shrink-0 rounded-full"
          @click="applyPreset(preset)"
        >
          {{ preset.shortcutLabel }}
        </UButton>
      </div>
    </div>
  </div>
</template>
