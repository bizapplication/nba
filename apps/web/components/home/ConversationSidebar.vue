<script setup lang="ts">
const props = withDefaults(defineProps<{
  activeId?: string | null
}>(), {
  activeId: null
})

const { clearDraft, recentConversations } = useHomeWorkspace()
</script>

<template>
  <aside class="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-default/70 bg-white/92 p-4 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.35)] sm:p-5">
    <div class="space-y-4 border-b border-default/70 pb-4">
      <div class="space-y-2">
        <p class="text-sm font-semibold text-highlighted">
          历史会话
        </p>
        <p class="text-xs leading-6 text-muted">
          这里只保留简洁会话列表，用来快速切回某条对话，不展开成任务面板。
        </p>
      </div>

      <UButton
        to="/home"
        icon="i-lucide-square-pen"
        color="primary"
        block
        @click="clearDraft"
      >
        新对话
      </UButton>
    </div>

    <div class="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
      <NuxtLink
        v-for="conversation in recentConversations"
        :key="conversation.id"
        :to="`/home/chat/${conversation.id}`"
        :class="[
          'block rounded-[1.5rem] border px-4 py-3 transition',
          activeId === conversation.id
            ? 'border-primary/35 bg-primary/6 shadow-[0_18px_40px_-36px_rgba(0,220,130,0.45)]'
            : 'border-default/70 bg-default/20 hover:border-primary/25 hover:bg-primary/5'
        ]"
      >
        <p class="truncate text-sm font-semibold text-highlighted">
          {{ conversation.title }}
        </p>
        <p class="mt-1 text-xs leading-6 text-muted">
          {{ conversation.updatedAt }}
        </p>
      </NuxtLink>
    </div>
  </aside>
</template>
