<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <AppSidebar
      :is-open="sidebarOpen"
      @close="closeSidebar"
    />

    <!-- Main Content -->
    <main
      :class="[
        'flex-1 transition-all duration-300',
        sidebarOpen ? 'md:ml-64' : 'ml-0'
      ]"
    >
      <!-- Mobile Header -->
      <div class="md:hidden flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4">
        <button
          @click="openSidebar"
          class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <i data-lucide="menu" class="w-5 h-5"></i>
        </button>
        <router-link to="/" class="flex items-center gap-2 text-lg font-bold text-blue-600 dark:text-blue-400">
          <i :data-lucide="cubeIcon" class="w-6 h-6"></i>
          <span>NBA</span>
        </router-link>
      </div>

      <!-- Content -->
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createIcons, icons } from 'lucide'

const sidebarOpen = ref(false)
const cubeIcon = 'cube'

function openSidebar() {
  sidebarOpen.value = true
}

function closeSidebar() {
  sidebarOpen.value = false
}

// Initialize Lucide icons
onMounted(() => {
  createIcons({
    icons,
    nameAttr: 'data-lucide'
  })
})

// Close sidebar on window resize to desktop
onUnmounted(() => {
  if (window.innerWidth >= 768) {
    sidebarOpen.value = false
  }
})
</script>