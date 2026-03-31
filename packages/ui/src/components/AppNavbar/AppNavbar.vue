<template>
  <header class="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur">
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <router-link to="/" class="flex items-center gap-2 text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            <i :data-lucide="cubeIcon" class="w-8 h-8"></i>
            <span>NBA</span>
          </router-link>
        </div>

        <!-- 导航菜单 -->
        <nav class="hidden md:flex items-center gap-6">
          <router-link
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            active-class="text-blue-600 dark:text-blue-400 font-medium"
          >
            <i :data-lucide="item.icon" class="w-5 h-5"></i>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <!-- 右侧操作区 -->
        <div class="flex items-center gap-4">
          <!-- 主题切换按钮 -->
          <button
            @click="toggleColorMode"
            class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <i :data-lucide="isDark ? 'sun' : 'moon'" class="w-5 h-5"></i>
          </button>

          <!-- 移动端菜单按钮 -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <i data-lucide="menu" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <!-- 移动端菜单 -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden py-4 border-t border-gray-200 dark:border-gray-800"
      >
        <nav class="flex flex-col gap-2">
          <router-link
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            @click="mobileMenuOpen = false"
          >
            <i :data-lucide="item.icon" class="w-5 h-5"></i>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { createIcons, icons } from 'lucide'

const props = defineProps<{
  colorMode?: 'light' | 'dark'
}>()

const emit = defineEmits<{
  'update:colorMode': [mode: 'light' | 'dark']
}>()

const mobileMenuOpen = ref(false)
const cubeIcon = 'cube'

const isDark = computed(() => props.colorMode === 'dark')

const navigation = [
  {
    label: '首页',
    path: '/',
    icon: 'home'
  },
  {
    label: 'ERP',
    path: '/erp',
    icon: 'building-2'
  },
  {
    label: 'CRM',
    path: '/crm',
    icon: 'users'
  },
  {
    label: '平台',
    path: '/platform',
    icon: 'settings'
  }
]

function toggleColorMode() {
  const newMode = isDark.value ? 'light' : 'dark'
  emit('update:colorMode', newMode)
}

// Initialize Lucide icons
onMounted(() => {
  createIcons({
    icons,
    nameAttr: 'data-lucide'
  })
})

// Re-initialize icons when menu opens/closes
watch(mobileMenuOpen, () => {
  setTimeout(() => {
    createIcons({
      icons,
      nameAttr: 'data-lucide'
    })
  }, 0)
})
</script>
