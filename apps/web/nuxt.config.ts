export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-07-11',
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  devtools: {
    enabled: process.env.NUXT_DEVTOOLS === 'true'
  },
  ui: {
    fonts: false
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/': { redirect: '/erp' }
  },
  runtimeConfig: {
    financeApiBase: process.env.NUXT_FINANCE_API_BASE || 'http://127.0.0.1:3001'
  }
})
