# @nba/web

NBA Web 前端 - 基于 Nuxt 3 和 @nuxt/ui 的现代化 Web 应用

## 技术栈

- **Nuxt 3** - Vue 元框架
- **Vue 3** - UI 库
- **@nuxt/ui** - UI 组件库（基于 Headless UI + Tailwind CSS）
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **@nba/ui** - 共享 Vue UI 组件库
- **@nba/shared** - 共享类型与工具

## 功能特性

- ⚡️ 服务端渲染（SSR）与静态生成（SSG）
- 🚀 优化的页面加载与路由
- 📱 响应式设计
- 🔒 认证与授权
- 🌐 国际化支持
- 🎨 可定制主题
- 🔄 自动导入组件

## 目录结构

```
web/
├── src/
│   ├── components/       # 页面组件（自动导入）
│   ├── composables/      # 组合式函数（自动导入）
│   ├── layouts/          # 布局模板
│   ├── middleware/       # 中间件
│   ├── pages/            # 页面路由（自动生成路由）
│   ├── plugins/          # 插件
│   ├── stores/           # Pinia 状态管理（自动导入）
│   ├── types/            # 类型定义
│   ├── utils/            # 工具函数
│   └── app.vue           # 根组件
├── public/               # 静态资源
├── nuxt.config.ts        # Nuxt 配置
├── package.json
└── tsconfig.json
```

## 安装

```bash
pnpm install
```

## 开发

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

开发服务器默认运行在 `http://localhost:3000`

## 构建

```bash
# 生产构建
pnpm build

# 预览生产构建
pnpm preview
```

## 路由结构

Nuxt 3 基于文件系统的路由：

### 认证路由 `pages/auth/`
- `/auth/login` - 登录页面
- `/auth/register` - 注册页面
- `/auth/forgot-password` - 忘记密码

### 仪表盘路由 `pages/dashboard/`
- `/` - 首页/仪表盘
- `/dashboard` - 仪表盘
- `/dashboard/settings` - 设置
- `/dashboard/profile` - 个人资料

### API 路由 `server/api/`
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/users` - 用户列表

## 组件使用

### 使用 @nuxt/ui 组件

```vue
<script setup>
import { UButton, UCard, UInput } from '#ui'
</script>

<template>
  <UCard>
    <UInput v-model="input" placeholder="输入内容..." />
    <UButton @click="submit">提交</UButton>
  </UCard>
</template>
```

### 使用共享组件库

```vue
<script setup>
import { Button, Card, Input } from '@nba/ui'
</script>

<template>
  <Card>
    <Input placeholder="输入内容..." />
    <Button>点击我</Button>
  </Card>
</template>

<style>
@import '@nba/ui/style.css';
</style>
```

### 自动导入

Nuxt 3 自动导入组件和组合式函数：

```vue
<script setup>
// 自动导入 composables
const user = useAuthUser()
const toast = useToast()

// 自动导入组件
// <UButton>, <UCard>, <UInput> 等
</script>

<template>
  <UButton>按钮</UButton>
</template>
```

## 配置

### Nuxt 配置 (`nuxt.config.ts`)

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2024-03-31',
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt'
  ],

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true
  },

  // Runtime Config
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    }
  },

  // CSS
  css: [
    '@nba/ui/style.css'
  ],

  // Auto-imports
  imports: {
    dirs: ['types']
  }
})
```

### Tailwind 配置

```typescript
// tailwind.config.ts
export default {
  content: [
    './components/**/*.{js,ts,vue}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    '../../packages/ui/src/**/*.{js,ts,vue}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7'
        }
      }
    }
  }
}
```

## 状态管理

### Pinia Store（自动导入）

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref('')

  const login = async (credentials) => {
    // 登录逻辑
  }

  const logout = () => {
    // 登出逻辑
  }

  return {
    user,
    token,
    login,
    logout
  }
})
```

```vue
<script setup>
// 自动导入 store
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
</script>
```

## API 调用

### 使用 $fetch

```vue
<script setup>
const { data, pending, error } = await useFetch('/api/users', {
  baseURL: useRuntimeConfig().public.apiUrl
})

// 或者使用 useAsyncData
const { data } = await useAsyncData('users', () =>
  $fetch('/api/users', {
    baseURL: useRuntimeConfig().public.apiUrl
  })
)
</script>
```

### API 路由

```typescript
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const users = await db.users.findMany()
  return users
})
```

## 中间件

### 认证中间件

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie('auth_token')

  if (!token.value) {
    return navigateTo('/auth/login')
  }
})
```

### 使用中间件

```vue
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

## 环境变量

### 开发环境 `.env.development`

```env
NUXT_PUBLIC_API_URL=http://localhost:3000/api
NUXT_PUBLIC_APP_NAME=NBA Web (Dev)
```

### 生产环境 `.env.production`

```env
NUXT_PUBLIC_API_URL=https://api.nba.com
NUXT_PUBLIC_APP_NAME=NBA Web
```

## 性能优化

- ✅ 图片优化（`<NuxtImg>` 或 `@nuxt/image`）
- ✅ 代码分割
- ✅ 懒加载组件
- ✅ 服务端渲染
- ✅ 静态生成
- ✅ 缓存策略

## 部署

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel deploy
```

### 部署到 Netlify

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 开发团队习惯

### 组件开发
```bash
# 使用 @nuxt/ui 组件（优先）
# 组件自动导入，无需 import

# 使用共享组件库
import { Component } from '@nba/ui'
```

### 状态管理
```bash
# 使用 Pinia store
# store 自动导入，位于 stores/ 目录
```

### 样式
```bash
# 使用 Tailwind CSS
# 使用 @nuxt/ui 组件样式
# 引入共享组件库样式
```

### API 调用
```bash
# 使用 useFetch 或 $fetch
# API 路由位于 server/api/ 目录
```

## 浏览器支持

- Chrome (最新)
- Firefox (最新)
- Safari (最新)
- Edge (最新)

## 参考资源

- [Nuxt 3 官方文档](https://nuxt.com/)
- [Vue 3 文档](https://vuejs.org/)
- [@nuxt/ui 文档](https://ui.nuxt.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
