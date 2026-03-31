<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
      <div class="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            下一代业务应用
          </h1>
          <p class="text-xl sm:text-2xl mb-8 text-blue-100">
            基于 AI 的企业级业务平台
          </p>
          <div class="flex justify-center gap-4">
            <UButton size="lg" color="white" variant="solid">
              立即开始
            </UButton>
            <UButton size="lg" color="white" variant="outline">
              了解更多
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-center mb-12">
        核心功能
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <UIcon :name="feature.icon" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ feature.title }}</h3>
          <p class="text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <!-- Modules Section -->
    <div class="bg-gray-100 dark:bg-gray-800 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center mb-12">
          业务模块
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="module in modules"
            :key="module.title"
            class="bg-white dark:bg-gray-900 rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
            @click="navigateTo(module.path)"
          >
            <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UIcon :name="module.icon" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-2">{{ module.title }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">{{ module.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const features = [
  {
    title: '智能对话',
    description: '基于 AI 的自然语言交互，快速完成业务操作',
    icon: 'i-heroicons-chat-bubble-left-right'
  },
  {
    title: '数据分析',
    description: '智能分析业务数据，提供决策支持',
    icon: 'i-heroicons-chart-bar'
  },
  {
    title: '自动化流程',
    description: '自动化处理重复性任务，提升工作效率',
    icon: 'i-heroicons-arrow-path'
  },
  {
    title: '多端同步',
    description: 'Web、桌面、CLI 多端数据实时同步',
    icon: 'i-heroicons-device-phone-mobile'
  },
  {
    title: '权限管理',
    description: '细粒度的权限控制，确保数据安全',
    icon: 'i-heroicons-shield-check'
  },
  {
    title: '技能市场',
    description: '丰富的技能插件，按需扩展功能',
    icon: 'i-heroicons-puzzle-piece'
  }
]

const modules = [
  {
    title: 'ERP 系统',
    description: '企业资源规划，包括库存、财务、生产等',
    icon: 'i-heroicons-building-office-2',
    path: '/erp'
  },
  {
    title: 'CRM 系统',
    description: '客户关系管理，包括客户、线索、商机等',
    icon: 'i-heroicons-users',
    path: '/crm'
  },
  {
    title: '平台服务',
    description: '身份认证、权限控制、技能市场等',
    icon: 'i-heroicons-cog-6-tooth',
    path: '/platform'
  }
]
</script>
