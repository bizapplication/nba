<script setup lang="ts">
const open = useState('notifications-open', () => false)

const notifications = [
  {
    id: 'noti-1',
    title: 'ERP 壳层回迁进行中',
    description: '外层 apps/web 正在把 dashboard shell 与导航体验向原始 ERP 前端收拢。',
    time: '刚刚'
  },
  {
    id: 'noti-2',
    title: '代表链路已通过 cutover 验证',
    description: '供应商发票、收款单与报销单都已经验证能回流 finance 交易结果层。',
    time: '30 分钟前'
  },
  {
    id: 'noti-3',
    title: 'nba_new 已不再是运行前置',
    description: '当前保留 nba_new 仅用于过渡与对照，不再作为 outer runtime dependency。',
    time: '今天'
  }
]
</script>

<template>
  <USlideover v-model:open="open" title="通知中心" side="right">
    <template #body>
      <div class="space-y-4">
        <UCard
          v-for="item in notifications"
          :key="item.id"
          variant="subtle"
          class="rounded-2xl"
        >
          <div class="space-y-1">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-highlighted">
                {{ item.title }}
              </p>
              <span class="text-xs text-muted">{{ item.time }}</span>
            </div>
            <p class="text-sm leading-6 text-toned">
              {{ item.description }}
            </p>
          </div>
        </UCard>
      </div>
    </template>
  </USlideover>
</template>
