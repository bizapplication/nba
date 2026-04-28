<script setup lang="ts">
import type { HomeChatMessage } from '~/types/home'

const route = useRoute()
const messageViewport = ref<HTMLElement | null>(null)
const { getThread, sendMessageToThread } = useHomeWorkspace()

const runId = computed(() => {
  const value = route.params.id
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const thread = computed(() => {
  return getThread(runId.value)
})

function messageAlignment(role: HomeChatMessage['role']) {
  return role === 'user' ? 'justify-end' : 'justify-start'
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
      return '你'
    case 'assistant':
      return '助手'
    default:
      return '系统'
  }
}

async function continueConversation() {
  if (!thread.value) {
    return
  }

  sendMessageToThread(thread.value.runId)
  await nextTick()
}

watch(
  () => thread.value?.messages.length ?? 0,
  async () => {
    await nextTick()
    messageViewport.value?.scrollTo({
      top: messageViewport.value.scrollHeight,
      behavior: 'smooth'
    })
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
    <div class="grid h-full min-h-0 gap-3 xl:grid-cols-[288px_minmax(0,1fr)]">
      <HomeConversationSidebar :active-id="runId" />

      <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,251,248,0.95))] shadow-[0_28px_72px_-48px_rgba(15,23,42,0.42)]">
        <div class="shrink-0 border-b border-default/60 px-5 py-3 sm:px-6">
          <HomeShellControlRow />
        </div>

        <template v-if="thread">
          <div ref="messageViewport" class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div class="mx-auto flex w-full max-w-[1120px] flex-col gap-4">
              <div
                v-for="message in thread.messages"
                :key="message.id"
                :class="['flex', messageAlignment(message.role)]"
              >
                <article
                  :class="['w-full max-w-[56rem] rounded-[1.5rem] border px-4 py-4 shadow-sm', messageTone(message.role)]"
                >
                  <div class="flex items-center gap-3 text-xs text-muted">
                    <span class="font-semibold text-highlighted">{{ messageLabel(message.role) }}</span>
                    <span>{{ message.createdAt }}</span>
                  </div>
                  <p class="mt-3 whitespace-pre-line text-sm leading-7 text-toned">
                    {{ message.content }}
                  </p>
                </article>
              </div>
            </div>
          </div>

          <footer class="shrink-0 border-t border-default/70 px-4 py-3 sm:px-6">
            <div class="mx-auto max-w-[1120px]">
              <HomeConversationComposer
                mode="docked"
                submit-label="继续发送"
                @submit="continueConversation"
              />
            </div>
          </footer>
        </template>

        <div v-else class="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <UCard class="w-full max-w-xl rounded-[1.75rem] border border-default/70 bg-white/92">
            <div class="space-y-4">
              <div class="space-y-2">
                <p class="text-base font-semibold text-highlighted">
                  找不到这条会话
                </p>
                <p class="text-sm leading-7 text-toned">
                  当前会话只保存在前端本地状态里。如果页面已经刷新，之前临时创建的会话可能不会继续保留。
                </p>
              </div>

              <UButton to="/home" icon="i-lucide-square-pen" color="primary">
                回到新对话
              </UButton>
            </div>
          </UCard>
        </div>
      </section>
    </div>
  </div>
</template>
