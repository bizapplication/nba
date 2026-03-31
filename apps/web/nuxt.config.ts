// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  // SPA 模式：禁用服务端渲染，启用客户端渲染
  ssr: false,

  modules: ['@nuxt/ui'],

  ui: {
    global: true,
    icons: ['heroicons', 'lucide'],
    fonts: {
      provider: 'none'
    }
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: ''
  },

  tailwindcss: {
    viewer: false,
  },

  app: {
    head: {
      title: 'NBA - 下一代业务应用',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '基于 AI 的企业级业务平台，集成 CRM、ERP 等核心业务系统' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // 部署时需要改为实际的后端 API 地址
      apiBase: process.env.API_BASE_URL || 'http://localhost:3000'
    }
  }
})
