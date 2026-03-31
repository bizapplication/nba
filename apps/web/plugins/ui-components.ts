import { defineNuxtPlugin } from '#app'

// 创建 UI 组件的 Nuxt 兼容版本
export default defineNuxtPlugin((nuxtApp) => {
  // Nuxt 3 会自动将 NuxtLink 注入到组件中
  // 我们需要在 layouts 中使用 Nuxt 组件而不是 @nba/ui 的组件
})
