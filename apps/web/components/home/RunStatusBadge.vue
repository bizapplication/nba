<script setup lang="ts">
import type { HomeRunStatus } from '~/types/home'

const props = defineProps<{
  status: HomeRunStatus
}>()

const color = computed(() => {
  switch (props.status) {
    case 'running':
      return 'primary'
    case 'completed':
      return 'success'
    case 'blocked':
      return 'warning'
    default:
      return 'neutral'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 'running':
      return '运行中'
    case 'completed':
      return '已完成'
    case 'blocked':
      return '已阻塞'
    default:
      return '已排队'
  }
})
</script>

<template>
  <UBadge :color="color" variant="subtle">
    {{ label }}
  </UBadge>
</template>
