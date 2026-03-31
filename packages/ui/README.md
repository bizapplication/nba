# @nba/ui

NBA UI 组件库 - 基于 Vue 3、Tailwind CSS 和 Vite 的可复用组件库

## 技术栈

- **Vue 3** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具
- **@vueuse/core** - Vue 组合式工具库
- **lucide-vue-next** - 图标库
- **class-variance-authority** - 组件变体管理

## 功能特性

- 🎨 现代化设计系统
- 🧩 完整的组件集合
- 🎭 组件变体与主题
- ♿ 可访问性支持
- 📱 响应式设计
- 🔧 高度可定制
- ⚡️ 优化的构建输出

## 目录结构

```
ui/
├── src/
│   ├── index.ts          # 主入口
│   ├── components/        # 组件
│   │   ├── button/
│   │   │   ├── Button.vue
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── card/
│   │   ├── input/
│   │   ├── modal/
│   │   ├── table/
│   │   └── ...
│   ├── composables/      # 组合式函数
│   │   ├── useCn.ts
│   │   └── useVariant.ts
│   ├── lib/              # 工具函数
│   │   └── cn.ts         # className 合并
│   ├── utils/            # 工具
│   └── styles.css        # 全局样式
├── package.json
├── vite.config.ts        # Vite 配置
├── tailwind.config.ts    # Tailwind 配置
└── tsconfig.json
```

## 安装

```bash
# 在应用中安装
pnpm add @nba/ui
```

### 依赖

```bash
# 确保安装了 Vue
pnpm add vue

# 如果需要完整功能，安装推荐依赖
pnpm add @vueuse/core tailwindcss
```

## 使用

### 基础使用

```vue
<script setup>
import { Button, Card, Input } from '@nba/ui'
</script>

<template>
  <div>
    <Card class="mb-4">
      <h1>NBA UI</h1>
    </Card>
    <Input placeholder="输入内容..." />
    <Button>点击我</Button>
  </div>
</template>

<style>
@import '@nba/ui/style.css';
</style>
```

### 在 Nuxt 3 中使用

```vue
<script setup>
// 直接使用，自动导入配置
import { Button, Card, Input } from '@nba/ui'
</script>

<template>
  <UContainer>
    <Card>
      <Input v-model="input" placeholder="输入内容..." />
      <Button @click="submit">提交</Button>
    </Card>
  </UContainer>
</template>

<style>
@import '@nba/ui/style.css';
</style>
```

## 组件列表

### 表单组件
- `Button` - 按钮
- `Input` - 输入框
- `Textarea` - 文本域
- `Select` - 选择器
- `Checkbox` - 复选框
- `Radio` - 单选框
- `Switch` - 开关
- `Form` - 表单

### 布局组件
- `Card` - 卡片
- `Container` - 容器
- `Grid` - 网格布局
- `Flex` - 弹性布局
- `Spacer` - 间距填充

### 反馈组件
- `Alert` - 提示
- `Toast` - 消息提示
- `Modal` - 模态框
- `Dialog` - 对话框
- `Badge` - 徽章
- `Progress` - 进度条

### 数据展示
- `Table` - 表格
- `Avatar` - 头像
- `Skeleton` - 骨架屏
- `Empty` - 空状态
- `Divider` - 分割线

### 导航组件
- `Tabs` - 标签页
- `Breadcrumb` - 面包屑
- `Pagination` - 分页
- `Menu` - 菜单
- `Dropdown` - 下拉菜单

### 其他组件
- `Icon` - 图标
- `Spinner` - 加载中
- `Collapse` - 折叠面板

## 组件使用示例

### Button 组件

```vue
<script setup>
import { Button } from '@nba/ui'
</script>

<template>
  <div class="space-x-2">
    <!-- 变体 -->
    <Button variant="default">默认</Button>
    <Button variant="primary">主要</Button>
    <Button variant="secondary">次要</Button>
    <Button variant="destructive">危险</Button>
    <Button variant="ghost">幽灵</Button>

    <!-- 尺寸 -->
    <Button size="sm">小号</Button>
    <Button size="default">默认</Button>
    <Button size="lg">大号</Button>

    <!-- 状态 -->
    <Button :disabled="true">禁用</Button>
    <Button :loading="true">加载中</Button>

    <!-- 图标 -->
    <Button>
      <Icon name="lucide:check" class="mr-2" />
      提交
    </Button>
  </div>
</template>
```

### Card 组件

```vue
<script setup>
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@nba/ui'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>标题</CardTitle>
      <CardDescription>描述文本</CardDescription>
    </CardHeader>
    <CardContent>
      <!-- 卡片内容 -->
    </CardContent>
    <CardFooter>
      <!-- 底部操作 -->
      <Button>操作</Button>
    </CardFooter>
  </Card>
</template>
```

### Input 组件

```vue
<script setup>
import { Input, Label } from '@nba/ui'

const value = ref('')
</script>

<template>
  <div class="space-y-2">
    <Label for="email">邮箱</Label>
    <Input
      id="email"
      v-model="value"
      type="email"
      placeholder="请输入邮箱"
      :error="error"
      :error-message="errorMessage"
    />
  </div>
</template>
```

### Modal 组件

```vue
<script setup>
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@nba/ui'

const isOpen = ref(false)
const open = () => { isOpen.value = true }
const close = () => { isOpen.value = false }
</script>

<template>
  <Button @click="open">打开模态框</Button>

  <Modal :is-open="isOpen" @close="close">
    <ModalContent>
      <ModalHeader>
        <ModalTitle>标题</ModalTitle>
      </ModalHeader>
      <ModalBody>
        模态框内容
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" @click="close">取消</Button>
        <Button @click="close">确认</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
</template>
```

### Table 组件

```vue
<script setup>
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@nba/ui'

const data = ref([
  { id: 1, name: '张三', email: 'zhang@example.com' },
  { id: 2, name: '李四', email: 'li@example.com' }
])
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>姓名</TableHead>
        <TableHead>邮箱</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="item in data" :key="item.id">
        <TableCell>{{ item.id }}</TableCell>
        <TableCell>{{ item.name }}</TableCell>
        <TableCell>{{ item.email }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
```

## 工具函数

### className 合并

```typescript
import { cn } from '@nba/ui'

// 使用 clsx + tailwind-merge
const className = cn(
  'base-class',
  isActive && 'active-class',
  props.className,
  'hover:scale-105'
)
```

### 组合式函数

```typescript
import { useCn } from '@nba/ui/composables/useCn'

const { cn } = useCn()
```

## 配置

### Tailwind 配置

在项目的 `tailwind.config.ts` 中引入：

```typescript
import uiConfig from '@nba/ui/tailwind.config'

export default {
  content: [
    './src/**/*.{js,ts,vue}',
    '../../packages/ui/src/**/*.{js,ts,vue}'
  ],
  theme: {
    extend: {
      colors: {
        // 自定义颜色
      }
    }
  },
  presets: [uiConfig]
}
```

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NbaUi',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['vue', '@vueuse/core'],
      output: {
        globals: {
          vue: 'Vue',
          '@vueuse/core': 'VueUse'
        }
      }
    }
  }
})
```

## 开发

```bash
# 开发模式（监听）
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

## 创建新组件

### 组件结构

```
components/
  └── component-name/
      ├── ComponentName.vue     # 组件文件
      ├── index.ts              # 导出
      └── types.ts              # 类型定义
```

### 示例

```vue
<!-- components/my-component/MyComponent.vue -->
<script setup lang="ts">
import { cn } from '@nba/ui/lib/cn'
import type { MyComponentProps } from './types'

const props = withDefaults(defineProps<MyComponentProps>(), {
  variant: 'default',
  size: 'md'
})

const emits = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (e: MouseEvent) => {
  emits('click', e)
}
</script>

<template>
  <button
    :class="cn(baseClasses, variantClasses[variant], sizeClasses[size])"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style scoped>
/* 组件特定样式 */
</style>
```

```typescript
// components/my-component/types.ts
export interface MyComponentProps {
  variant?: 'default' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}
```

```typescript
// components/my-component/index.ts
export { default as MyComponent } from './MyComponent.vue'
export type { MyComponentProps } from './types'
```

```typescript
// index.ts
export { MyComponent } from './components/my-component'
```

## 开发团队习惯

### 组件命名
- 使用 PascalCase
- 清晰描述组件功能
- 避免与 @nuxt/ui 组件冲突

### 样式约定
- 优先使用 Tailwind CSS
- 组件变体使用 `class-variance-authority`
- 避免内联样式
- scoped 样式用于组件特定样式

### 类型安全
- 所有 props 使用 TypeScript 接口
- 提供 props 默认值
- 明确 emits 类型定义

### 文档
- 使用 JSDoc 注释
- 提供使用示例
- 说明 props 和 emits

## 依赖关系

- **Peer Dependencies**: Vue 3+, Tailwind CSS
- **Dependencies**:
  - `class-variance-authority`
  - `clsx`
  - `tailwind-merge`
  - `lucide-vue-next`
  - `@vueuse/core`
  - `@nba/shared`

## 可访问性

所有组件遵循 WAI-ARIA 规范，支持：
- 键盘导航
- 屏幕阅读器
- 焦点管理
- 适当的 ARIA 属性

## 参考资源

- [Vue 3 文档](https://vuejs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [@vueuse/core 文档](https://vueuse.org/)
- [class-variance-authority](https://cva.style/)
