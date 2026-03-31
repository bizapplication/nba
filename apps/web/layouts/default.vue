<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur">
      <UContainer>
        <div class="flex h-16 items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              <UIcon name="i-heroicons-cube" class="w-8 h-8" />
              <span>NBA</span>
            </NuxtLink>
          </div>

          <!-- 导航菜单 -->
          <nav class="hidden md:flex items-center gap-6">
            <NuxtLink
              v-for="item in navigation"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              active-class="text-blue-600 dark:text-blue-400 font-medium"
            >
              <UIcon :name="item.icon" class="w-5 h-5" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>

          <!-- 右侧操作区 -->
          <div class="flex items-center gap-4">
            <!-- 主题切换 -->
            <UButton
              :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
              color="gray"
              variant="ghost"
              size="sm"
              @click="toggleColorMode"
            />

            <!-- 移动端菜单按钮 -->
            <UButton
              icon="i-heroicons-bars-3"
              color="gray"
              variant="ghost"
              size="sm"
              class="md:hidden"
              @click="mobileMenuOpen = !mobileMenuOpen"
            />
          </div>
        </div>

        <!-- 移动端菜单 -->
        <div
          v-if="mobileMenuOpen"
          class="md:hidden py-4 border-t border-gray-200 dark:border-gray-800"
        >
          <nav class="flex flex-col gap-2">
            <NuxtLink
              v-for="item in navigation"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              @click="mobileMenuOpen = false"
            >
              <UIcon :name="item.icon" class="w-5 h-5" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>
      </UContainer>
    </header>

    <!-- 主内容区域 -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="bg-gray-900 text-white py-8 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p class="text-gray-400">
          © {{ currentYear }} NBA - 下一代业务应用. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const mobileMenuOpen = ref(false)

const isDark = computed(() => colorMode.value === 'dark')

const navigation = [
  {
    label: '首页',
    path: '/',
    icon: 'i-heroicons-home'
  },
  {
    label: 'ERP',
    path: '/erp',
    icon: 'i-heroicons-building-office-2'
  },
  {
    label: 'CRM',
    path: '/crm',
    icon: 'i-heroicons-users'
  },
  {
    label: '平台',
    path: '/platform',
    icon: 'i-heroicons-cog-6-tooth'
  }
]

function toggleColorMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const currentYear = computed(() => new Date().getFullYear())
</script>
