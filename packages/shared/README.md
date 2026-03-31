# @nba/shared

前后端共享代码库 - 类型定义、工具函数和常量

## 技术栈

- **TypeScript** - 类型定义与工具
- **Zod** - 运行时类型验证
- **Vite** - 构建工具

## 功能特性

- 🔒 统一的类型定义
- 🔧 常用工具函数
- 📐 数据验证 Schema
- ⚙️ 配置常量
- 🎯 业务类型模型

## 目录结构

```
shared/
├── src/
│   ├── index.ts          # 主入口
│   ├── types/            # 类型定义
│   │   ├── user.ts
│   │   ├── business.ts
│   │   └── common.ts
│   ├── schemas/          # Zod 验证 Schema
│   │   ├── user.ts
│   │   └── validation.ts
│   ├── utils/            # 工具函数
│   │   ├── format.ts
│   │   ├── date.ts
│   │   └── validation.ts
│   └── constants/        # 常量定义
│       ├── api.ts
│       └── config.ts
├── package.json
├── vite.config.ts        # Vite 构建配置
└── tsconfig.json
```

## 安装

```bash
# 在其他包中使用
pnpm add @nba/shared
```

## 使用

### 类型定义

```typescript
import type { User, UserRole } from '@nba/shared'

const user: User = {
  id: '123',
  name: 'John Doe',
  role: UserRole.ADMIN
}
```

### 数据验证

```typescript
import { userSchema } from '@nba/shared'

const result = userSchema.parse(userData)
if (!result.success) {
  console.error(result.error)
}
```

### 工具函数

```typescript
import { formatDate, validateEmail } from '@nba/shared'

const date = formatDate(new Date(), 'YYYY-MM-DD')
const isValid = validateEmail('user@example.com')
```

### 常量使用

```typescript
import { API_ENDPOINTS, ROLES } from '@nba/shared'

fetch(API_ENDPOINTS.USERS)
if (role === ROLES.ADMIN) {
  // 管理员逻辑
}
```

## 主要类型

### 用户类型
```typescript
interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}
```

### 业务类型
```typescript
interface Business {
  id: string
  name: string
  type: BusinessType
  status: BusinessStatus
  createdAt: Date
}

interface Customer {
  id: string
  businessId: string
  contactInfo: ContactInfo
  tags: string[]
}

interface Order {
  id: string
  customerId: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  createdAt: Date
}
```

### 通用类型
```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

type ID = string
```

## 工具函数

### 日期工具
```typescript
import { formatDate, parseDate, addDays, diffDays } from '@nba/shared'

// 格式化日期
formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')

// 解析日期字符串
parseDate('2024-03-31', 'YYYY-MM-DD')

// 日期计算
addDays(new Date(), 7)
diffDays(date1, date2)
```

### 字符串工具
```typescript
import { capitalize, truncate, slugify } from '@nba/shared'

// 首字母大写
capitalize('hello world') // 'Hello World'

// 截断字符串
truncate('This is a long text', 10) // 'This is a...'

// URL 友好化
slugify('Hello World!') // 'hello-world'
```

### 验证工具
```typescript
import { validateEmail, validatePhone, validateUrl } from '@nba/shared'

// 验证邮箱
validateEmail('user@example.com') // true

// 验证手机号
validatePhone('13800138000') // true

// 验证 URL
validateUrl('https://example.com') // true
```

### 数据工具
```typescript
import { deepClone, omit, pick } from '@nba/shared'

// 深拷贝
const copy = deepClone(original)

// 对象操作
const filtered = omit(user, ['password', 'secret'])
const selected = pick(user, ['id', 'name', 'email'])
```

## 验证 Schema

### 使用 Zod

```typescript
import { z } from 'zod'

// 用户 Schema
export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'guest'])
})

// 使用
const result = userSchema.safeParse(userData)
if (!result.success) {
  console.error(result.error)
}
```

## 常量定义

### API 端点
```typescript
export const API_ENDPOINTS = {
  // 认证
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh'
  },
  // 用户
  USERS: '/api/users',
  USER: (id: string) => `/api/users/${id}`,
  // 业务
  BUSINESS: '/api/business',
  CUSTOMERS: '/api/customers',
  ORDERS: '/api/orders'
}
```

### 状态码
```typescript
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}
```

### 业务常量
```typescript
export const BUSINESS_TYPES = {
  CORP: 'corporate',
  SMB: 'smb',
  SOLE: 'sole'
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}
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

## Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'NbaShared',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['zod'],
      output: {
        globals: {
          zod: 'zod'
        }
      }
    }
  }
})
```

## 版本发布

修改版本号后：

```bash
pnpm build
git commit -m "chore: bump version"
git tag v1.0.0
git push --tags
```

## 开发团队习惯

### 添加新类型
1. 在 `src/types/` 创建类型文件
2. 定义 TypeScript 接口
3. 在 `src/index.ts` 导出

### 添加新工具函数
1. 在 `src/utils/` 创建工具文件
2. 编写函数实现
3. 添加 JSDoc 注释
4. 在 `src/index.ts` 导出

### 添加验证 Schema
1. 在 `src/schemas/` 创建 Schema 文件
2. 使用 Zod 定义 Schema
3. 在 `src/index.ts` 导出

### 添加常量
1. 在 `src/constants/` 创建常量文件
2. 定义常量和枚举
3. 在 `src/index.ts` 导出

## 依赖

- `zod` - 运行时类型验证
- `vite` - 构建工具
