<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">CRM 系统</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          客户关系管理 - 客户、线索、商机、互动记录
        </p>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">功能模块</h2>
        </template>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="item in crmModules"
            :key="item.title"
            class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <UIcon :name="item.icon" class="w-8 h-8 text-green-500 mb-2" />
            <p class="font-medium">{{ item.title }}</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const crmModules = [
  { title: '客户管理', icon: 'i-heroicons-users' },
  { title: '线索管理', icon: 'i-heroicons-sparkles' },
  { title: '商机管理', icon: 'i-heroicons-currency-dollar' },
  { title: '互动记录', icon: 'i-heroicons-chat-bubble-left' },
  { title: '任务管理', icon: 'i-heroicons-check-circle' },
  { title: '日程管理', icon: 'i-heroicons-calendar' },
  { title: '报表分析', icon: 'i-heroicons-chart-bar' },
  { title: '客户360', icon: 'i-heroicons-globe-alt' }
]
</script>
