<script setup lang="ts">
const props = defineProps<{
  collapsed: boolean
}>()

const notificationsOpen = useState('notifications-open', () => false)
const colorMode = useColorMode()

const items = computed<any>(() => [[
  {
    label: '通知中心',
    icon: 'i-lucide-bell',
    onSelect: () => {
      notificationsOpen.value = true
    }
  },
  {
    label: colorMode.value === 'dark' ? '切换浅色模式' : '切换深色模式',
    icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
    onSelect: () => {
      colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
    }
  },
  {
    label: '个人设置',
    icon: 'i-lucide-settings'
  },
  {
    label: '退出登录',
    icon: 'i-lucide-log-out'
  }
]])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      color="neutral"
      variant="ghost"
      class="w-full justify-start gap-3 rounded-2xl px-3 py-3"
      :ui="{ base: 'w-full justify-start' }"
    >
      <UAvatar
        alt="System User"
        src="https://i.pravatar.cc/80?img=12"
        size="md"
      />
      <div v-if="!props.collapsed" class="min-w-0 text-left">
        <p class="truncate text-sm font-semibold text-highlighted">
          Finance Operator
        </p>
        <p class="truncate text-xs text-muted">
          ERP Engineer
        </p>
      </div>
      <UIcon
        v-if="!props.collapsed"
        name="i-lucide-chevrons-up-down"
        class="ml-auto size-4 text-muted"
      />
    </UButton>
  </UDropdownMenu>
</template>
