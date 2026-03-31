# @nba/platform

NBA 平台服务 - IAM 身份认证/访问控制 + Skill 市场

## 技术栈

- **TypeScript** - 类型安全
- **Express** - Web 框架
- **JWT** - 令牌认证
- **bcryptjs** - 密码加密
- **Zod** - 数据验证

## 功能特性

### 身份认证（IAM）
- 🔐 多种登录方式（密码、OAuth、SSO）
- 🔄 JWT 令牌认证
- 📱 多设备会话管理
- 🛡️ 权限与角色控制
- 📝 审计日志

### 技能市场（Skill Market）
- 🛒 技能商店
- ⭐ 技能评分与评论
- 🔧 技能安装与管理
- 📊 技能使用统计
- 💰 技能付费与订阅

## 目录结构

```
platform/
├── src/
│   ├── index.ts          # 入口文件
│   ├── app.ts            # Express 应用
│   ├── routes/           # 路由
│   │   ├── auth.ts       # 认证路由
│   │   ├── users.ts      # 用户路由
│   │   ├── roles.ts      # 角色路由
│   │   ├── market.ts     # 市场路由
│   │   └── skills.ts     # 技能路由
│   ├── services/         # 服务层
│   │   ├── auth.ts       # 认证服务
│   │   ├── jwt.ts        # JWT 服务
│   │   ├── password.ts   # 密码服务
│   │   ├── session.ts    # 会话服务
│   │   ├── rbac.ts       # 权限服务
│   │   └── market.ts     # 市场服务
│   ├── middleware/       # 中间件
│   │   ├── auth.ts       # 认证中间件
│   │   ├── rbac.ts       # 权限中间件
│   │   ├── error.ts      # 错误处理
│   │   └── validation.ts # 数据验证
│   └── types/            # 类型定义
│       └── platform.ts
├── package.json
├── tsconfig.json
└── tsconfig.paths.json   # 路径别名配置
```

## 安装

```bash
pnpm install
```

## 配置

创建 `.env` 或 `.env.local` 文件：

```env
# 服务器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 密码策略
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true

# 技能市场配置
MARKETPLACE_ENABLED=true
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# 数据库配置（示例）
DATABASE_URL=postgresql://user:password@localhost:5432/nba_platform
```

## 使用

### 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
node dist/index.js
```

### 身份认证

```typescript
import { AuthService } from '@nba/platform/services/auth'

const authService = new AuthService({
  jwtSecret: process.env.JWT_SECRET
})

// 注册
const user = await authService.register({
  email: 'user@example.com',
  password: 'SecurePass123',
  name: 'John Doe'
})

// 登录
const result = await authService.login({
  email: 'user@example.com',
  password: 'SecurePass123'
})

// 验证令牌
const decoded = await authService.verifyToken(token)
```

### 权限控制

```typescript
import { RBACService } from '@nba/platform/services/rbac'

const rbac = new RBACService()

// 创建角色
await rbac.createRole({
  name: 'manager',
  permissions: [
    'users:read',
    'users:write',
    'reports:read'
  ]
})

// 检查权限
const hasPermission = await rbac.checkPermission(
  userId,
  'users:write'
)

// 分配角色
await rbac.assignRole(userId, 'manager')
```

### Express 中间件使用

```typescript
import express from 'express'
import { authMiddleware, rbacMiddleware } from '@nba/platform'

const app = express()

// 认证中间件
app.get('/api/profile', authMiddleware, (req, res) => {
  res.json(req.user)
})

// 权限中间件
app.delete('/api/users/:id',
  authMiddleware,
  rbacMiddleware('users:delete'),
  deleteUser
)
```

### 技能市场

```typescript
import { SkillMarket } from '@nba/platform/services/market'

const market = new SkillMarket()

// 获取技能列表
const skills = await market.listSkills({
  category: 'data-analysis',
  rating: 4.5,
  limit: 10
})

// 安装技能
await market.installSkill(userId, skillId)

// 获取已安装技能
const installed = await market.getUserSkills(userId)

// 提交评论
await market.submitReview({
  skillId,
  userId,
  rating: 5,
  comment: '非常有用！'
})
```

## IAM 功能详解

### 用户注册
```typescript
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

- 邮箱验证
- 密码强度检查
- 重复注册防护

### 登录流程
```typescript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

- 凭证验证
- 令牌生成（访问令牌 + 刷新令牌）
- 会话创建
- 登录日志

### 会话管理
- 多设备登录
- 会话过期控制
- 跨设备登出
- 记住我功能

### 权限系统
- 基于角色的访问控制（RBAC）
- 细粒度权限
- 权限继承
- 动态策略评估

## 技能市场功能

### 技能分类
- 数据分析
- 自动化
- 生成报告
- 集成服务
- 其他

### 技能信息
- 名称与描述
- 版本信息
- 作者信息
- 安装数量
- 评分与评论

### 评分系统
- 1-5 星评分
- 文字评论
- 评论审核
- 评分统计

### 计费模式
- 免费技能
- 一次性购买
- 订阅制
- 企业许可

## 开发

```bash
# 开发模式（tsx watch）
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

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新令牌
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重置密码

### 用户接口
- `GET /api/users/me` - 获取当前用户
- `PUT /api/users/me` - 更新用户信息
- `GET /api/users/:id` - 获取用户详情
- `GET /api/users` - 用户列表（需要权限）

### 角色权限接口
- `GET /api/roles` - 角色列表
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色
- `GET /api/permissions` - 权限列表

### 技能市场接口
- `GET /api/market/skills` - 技能列表
- `GET /api/market/skills/:id` - 技能详情
- `POST /api/market/skills/:id/install` - 安装技能
- `GET /api/market/my-skills` - 我的技能
- `POST /api/market/reviews` - 提交评论

## 数据模型

### User（用户）
```typescript
interface User {
  id: string
  email: string
  password: string  // bcrypt 加密
  name: string
  avatar?: string
  roles: string[]
  status: 'active' | 'inactive' | 'suspended'
  createdAt: Date
  updatedAt: Date
}
```

### Role（角色）
```typescript
interface Role {
  id: string
  name: string
  description?: string
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Permission（权限）
```typescript
interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

// 格式: resource:action
// 示例: users:read, users:write, reports:delete
```

### Session（会话）
```typescript
interface Session {
  id: string
  userId: string
  token: string
  refreshToken: string
  userAgent: string
  ipAddress: string
  expiresAt: Date
  createdAt: Date
}
```

### Skill（技能）
```typescript
interface Skill {
  id: string
  name: string
  description: string
  category: string
  version: string
  author: string
  installs: number
  rating: number
  reviews: Review[]
  pricing: {
    type: 'free' | 'purchase' | 'subscription'
    amount?: number
  }
  createdAt: Date
  updatedAt: Date
}

interface Review {
  id: string
  skillId: string
  userId: string
  rating: number
  comment: string
  createdAt: Date
}
```

## 安全措施

- ✅ 密码 bcrypt 加密
- ✅ JWT 令牌签名
- ✅ HTTPS 强制
- ✅ CORS 配置
- ✅ 速率限制
- ✅ SQL 注入防护
- ✅ XSS 防护
- ✅ CSRF 防护

## 开发团队习惯

### 本地开发
```bash
# 使用 tsx watch（快速反馈）
pnpm dev

# 服务运行在 http://localhost:3000
```

### 环境变量
```bash
# 开发环境使用 .env.local
# 生产环境使用 .env.production
# 不要将 .env 文件提交到版本控制
```

### 调试
```bash
# 使用 tsx + inspect
tsx --inspect src/index.ts

# 或使用 VSCode 调试器
```

### 路径别名
```typescript
// 使用 @ 前缀引用
import { AuthService } from '@/services/auth'
import { authMiddleware } from '@/middleware/auth'
```

## 依赖

- `express` - Web 框架
- `cors` - CORS 支持
- `jsonwebtoken` - JWT 实现
- `bcryptjs` - 密码加密
- `zod` - 数据验证
- `@nba/shared` - 共享类型
- `tsx` - TypeScript 执行引擎

## 参考资源

- [Express 文档](https://expressjs.com/)
- [JWT 认证](https://jwt.io/)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- [Zod](https://zod.dev/)
