<script setup lang="ts">
const { createMockRun } = useHomeWorkspace()

async function startConversation() {
  const run = createMockRun()
  await navigateTo(`/home/chat/${run.id}`)
}
</script>

<template>
  <div class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
    <div class="grid h-full min-h-0 gap-3 xl:grid-cols-[288px_minmax(0,1fr)]">
      <HomeConversationSidebar />

      <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,251,248,0.95))] px-5 py-5 shadow-[0_28px_72px_-48px_rgba(15,23,42,0.42)] sm:px-6 sm:py-6">
        <div class="shrink-0">
          <HomeShellControlRow />
        </div>

        <div class="mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 flex-col items-center justify-center gap-6">
          <div class="space-y-3 text-center">
            <div class="flex flex-wrap items-center justify-center gap-2">
              <UBadge color="primary" variant="soft">
                New Chat
              </UBadge>
            </div>
            <p class="mx-auto max-w-2xl text-sm leading-7 text-toned sm:text-base">
              输入问题、挂上文件、选一个模型，然后直接开始当前会话。首页不再先把你带去别的工作区。
            </p>
          </div>

          <div class="w-full">
            <HomeConversationComposer
              mode="centered"
              submit-label="开始对话"
              @submit="startConversation"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
