<script setup lang="ts">
const props = defineProps<{
  collapsed: boolean
}>()

const items: any = [[
  {
    label: 'NBA 总部',
    icon: 'i-lucide-building-2'
  },
  {
    label: '华东业务单元',
    icon: 'i-lucide-map-pinned'
  }
]]
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      color="neutral"
      variant="ghost"
      class="w-full justify-start gap-3 rounded-2xl px-3 py-3"
      :ui="{ base: 'w-full justify-start' }"
    >
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
        <UIcon name="i-lucide-building-2" class="size-4" />
      </div>
      <div v-if="!props.collapsed" class="min-w-0 text-left">
        <p class="truncate text-sm font-semibold text-highlighted">
          NBA 总部
        </p>
        <p class="truncate text-xs text-muted">
          Unified ERP Workspace
        </p>
      </div>
      <UIcon
        v-if="!props.collapsed"
        name="i-lucide-chevron-down"
        class="ml-auto size-4 text-muted"
      />
    </UButton>
  </UDropdownMenu>
</template>
