<template>
  <aside
    :class="[
      'fixed left-0 top-0 z-40 h-full w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-transform duration-300',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <!-- Sidebar Header -->
    <div class="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4">
      <router-link to="/" class="flex items-center gap-2 text-xl font-bold text-blue-600 dark:text-blue-400">
        <i :data-lucide="cubeIcon" class="w-8 h-8"></i>
        <span>NBA</span>
      </router-link>
      <button
        @click="$emit('close')"
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <!-- Sidebar Navigation -->
    <nav class="p-4 space-y-2">
      <div
        v-for="group in navigationGroups"
        :key="group.title"
        class="mb-4"
      >
        <p class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          {{ group.title }}
        </p>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          @click="$emit('close')"
        >
          <i :data-lucide="item.icon" class="w-5 h-5"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </div>
    </nav>
  </aside>

  <!-- Overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 md:hidden"
    @click="$emit('close')"
  />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { createIcons, icons } from 'lucide'

interface Props {
  isOpen?: boolean
}

defineProps<Props>()

defineEmits<{
  close: []
}>()

const cubeIcon = 'cube'

const navigationGroups = [
  {
    title: '主页',
    items: [
      {
        label: '首页',
        path: '/',
        icon: 'home'
      }
    ]
  },
  {
    title: '业务系统',
    items: [
      {
        label: 'ERP 系统',
        path: '/erp',
        icon: 'building-2'
      },
      {
        label: 'CRM 系统',
        path: '/crm',
        icon: 'users'
      }
    ]
  },
  {
    title: '平台服务',
    items: [
      {
        label: '平台服务',
        path: '/platform',
        icon: 'settings'
      }
    ]
  }
]

// Initialize Lucide icons
onMounted(() => {
  createIcons({
    icons,
    nameAttr: 'data-lucide'
  })
})

// Re-initialize icons when sidebar opens/closes
watch(() => defineProps<Props>().isOpen, () => {
  setTimeout(() => {
    createIcons({
      icons,
      nameAttr: 'data-lucide'
    })
  }, 300)
})
</script>