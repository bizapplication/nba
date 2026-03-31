<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">平台服务</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          平台服务 - 身份认证、权限控制、技能市场
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-orange-500" />
              <h2 class="text-xl font-semibold">IAM 服务</h2>
            </div>
          </template>
          <div class="space-y-4">
            <div v-for="feature in iamFeatures" :key="feature.title">
              <p class="font-medium">{{ feature.title }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-puzzle-piece" class="w-6 h-6 text-purple-500" />
              <h2 class="text-xl font-semibold">技能市场</h2>
            </div>
          </template>
          <div class="space-y-4">
            <div v-for="feature in marketFeatures" :key="feature.title">
              <p class="font-medium">{{ feature.title }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const iamFeatures = [
  { title: '身份认证', description: '支持密码、OAuth、SSO 多种登录方式' },
  { title: '权限控制', description: '基于角色的访问控制（RBAC）' },
  { title: '会话管理', description: '多设备会话管理，支持跨设备登出' },
  { title: '审计日志', description: '完整的操作审计追踪' }
]

const marketFeatures = [
  { title: '技能商店', description: '浏览和安装各种业务技能' },
  { title: '评分评论', description: '查看和提交技能评价' },
  { title: '订阅管理', description: '管理技能订阅和续费' },
  { title: '使用统计', description: '查看技能使用情况统计' }
]
</script>
