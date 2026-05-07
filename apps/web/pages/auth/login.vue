<script setup lang="ts">
const route = useRoute()
const auth = useDemoAuth()

const form = reactive({
  email: '',
  password: ''
})
const errorMessage = ref('')
const redirectTarget = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value ? value : '/home'
})

await auth.fetchCurrentUser()

if (auth.isAuthenticated.value) {
  await navigateTo(redirectTarget.value)
}

async function submit() {
  errorMessage.value = ''

  try {
    await auth.login(form)
    await navigateTo(redirectTarget.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请检查账号与密码。'
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] max-w-5xl items-center">
    <div class="grid w-full gap-6 lg:grid-cols-[minmax(0,1.1fr)_420px]">
      <section class="rounded-[2.5rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(243,251,247,0.94))] p-8 shadow-[0_32px_90px_-50px_rgba(15,23,42,0.42)]">
        <div class="space-y-5">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="primary" variant="soft">
              OpenClaw Demo
            </UBadge>
            <UBadge color="neutral" variant="outline">
              macOS Local
            </UBadge>
          </div>

          <div class="space-y-3">
            <h1 class="text-4xl font-semibold leading-tight text-highlighted">
              登录后直接进入本地 AI 控制面
            </h1>
            <p class="max-w-2xl text-sm leading-7 text-toned sm:text-base">
              这套 demo 会把 CRM、ERP、Platform、Agent API 和 OpenClaw sidecar 串成一条可演示链路。所有有副作用的动作都会先转成审批卡，再由你确认执行。
            </p>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded-2xl border border-default/70 bg-white/80 px-4 py-4">
              <p class="text-xs uppercase tracking-[0.22em] text-muted">
                Readonly
              </p>
              <p class="mt-2 text-sm leading-6 text-toned">
                先调 CRM / ERP 只读工具，做真实数据问答。
              </p>
            </div>
            <div class="rounded-2xl border border-default/70 bg-white/80 px-4 py-4">
              <p class="text-xs uppercase tracking-[0.22em] text-muted">
                Approval
              </p>
              <p class="mt-2 text-sm leading-6 text-toned">
                文件、命令、浏览器动作统一先审批。
              </p>
            </div>
            <div class="rounded-2xl border border-default/70 bg-white/80 px-4 py-4">
              <p class="text-xs uppercase tracking-[0.22em] text-muted">
                Operator
              </p>
              <p class="mt-2 text-sm leading-6 text-toned">
                审批通过后再调用 OpenClaw operator 或安全命令执行。
              </p>
            </div>
          </div>
        </div>
      </section>

      <UCard class="rounded-[2rem] border border-default/70 bg-white/92 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.4)]">
        <template #header>
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-highlighted">
              Demo 登录
            </h2>
            <p class="text-sm leading-6 text-muted">
              使用 `.env` 里配置的管理员账号进入本地 demo。
            </p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="submit">
          <UFormField label="邮箱">
            <UInput v-model="form.email" type="email" placeholder="admin@nba.demo" class="w-full" />
          </UFormField>

          <UFormField label="密码">
            <UInput v-model="form.password" type="password" placeholder="输入 demo 管理员密码" class="w-full" />
          </UFormField>

          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            title="登录失败"
            :description="errorMessage"
          />

          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="auth.isLoadingAuth.value"
          >
            进入控制面
          </UButton>
        </form>
      </UCard>
    </div>
  </div>
</template>
