<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">ERP 系统</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          企业资源规划 - 库存、财务、生产、人力资源
        </p>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">功能模块</h2>
        </template>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="item in erpModules"
            :key="item.title"
            class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <UIcon :name="item.icon" class="w-8 h-8 text-blue-500 mb-2" />
            <p class="font-medium">{{ item.title }}</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const erpModules = [
  { title: '库存管理', icon: 'i-heroicons-cube' },
  { title: '财务管理', icon: 'i-heroicons-currency-dollar' },
  { title: '生产管理', icon: 'i-heroicons-wrench-screwdriver' },
  { title: '人力资源', icon: 'i-heroicons-user-group' },
  { title: '采购管理', icon: 'i-heroicons-shopping-cart' },
  { title: '销售管理', icon: 'i-heroicons-chart-bar' },
  { title: '资产管理', icon: 'i-heroicons-home' },
  { title: '报表分析', icon: 'i-heroicons-document-chart-bar' }
]
</script>
