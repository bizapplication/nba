<script setup lang="ts">
const {
  modelOptions,
  selectedModel,
  setSelectedModel
} = useHomeWorkspace()

const notificationsOpen = useState('notifications-open', () => false)
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

function toggleColorMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <UDashboardSidebarCollapse color="neutral" variant="ghost" size="sm" square />
      <USelect
        v-model="selectedModel"
        :items="modelOptions"
        value-key="value"
        label-key="label"
        placeholder="选择模型"
        size="sm"
        class="w-[220px] max-w-full"
        @update:model-value="setSelectedModel"
      />
    </div>

    <div class="flex items-center gap-2">
      <UButton
        icon="i-lucide-bell"
        color="neutral"
        variant="ghost"
        size="sm"
        square
        aria-label="打开通知"
        @click="notificationsOpen = true"
      />
      <UButton
        :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
        color="neutral"
        variant="ghost"
        size="sm"
        square
        :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
        @click="toggleColorMode"
      />
    </div>
  </div>
</template>
