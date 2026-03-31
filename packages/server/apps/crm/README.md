# @nba/crm

NBA 业务应用：CRM 客户关系管理子系统

## 技术栈

- **TypeScript** - 类型安全
- **Express** - Web 框架
- **@nba/platform** - 身份认证与权限
- **MCP 协议** - 与 Agent 交互

## 功能特性

### 客户管理
- 👥 客户档案管理
- 🏢 公司信息管理
- 📞 联系人管理
- 🏷️ 客户分类与标签
- 📊 客户360视图

### 线索管理
- 🎯 线索采集与录入
- 🔄 线索跟进与转化
- 📈 线索漏斗分析
- 🎲 线索分配规则

### 商机管理
- 💰 商机创建与跟踪
- 📊 销售预测
- 🏆 成交分析
- 📅 关键日期提醒

### 互动记录
- 📝 客户互动日志
- 📧 邮件记录
- 📞 电话记录
- 💬 聊天记录

### 任务与日程
- ✅ 任务管理
- 📅 日程安排
- 🔔 提醒通知
- 👥 团队协作

### 报表分析
- 📊 销售报表
- 📈 趋势分析
- 🎯 绩效考核
- 📱 实时仪表盘

## 目录结构

```
crm/
├── src/
│   ├── index.ts          # 入口文件
│   ├── app.ts            # Express 应用
│   ├── routes/           # API 路由
│   │   ├── customers.ts
│   │   ├── leads.ts
│   │   ├── opportunities.ts
│   │   ├── activities.ts
│   │   ├── tasks.ts
│   │   └── reports.ts
│   ├── services/         # 业务逻辑
│   │   ├── customer.ts
│   │   ├── lead.ts
│   │   ├── opportunity.ts
│   │   ├── activity.ts
│   │   └── analytics.ts
│   ├── controllers/      # 控制器
│   │   ├── customer.ts
│   │   ├── lead.ts
│   │   └── opportunity.ts
│   ├── models/           # 数据模型
│   │   ├── customer.ts
│   │   ├── lead.ts
│   │   ├── opportunity.ts
│   │   └── activity.ts
│   ├── middleware/       # 中间件
│   │   └── auth.ts       # 平台认证中间件
│   └── types/            # 类型定义
│       └── crm.ts
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
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# 平台服务配置
PLATFORM_API_URL=http://localhost:3000
PLATFORM_API_KEY=your_api_key

# MCP 配置
MCP_SERVER_ENABLED=true
MCP_PORT=3010

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/nba_crm
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

服务运行在 `http://localhost:3001`

### API 使用示例

#### 客户管理

```typescript
// 创建客户
const response = await fetch('http://localhost:3001/api/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    name: 'ABC 公司',
    type: 'company',
    industry: '科技',
    contacts: [
      {
        name: '张三',
        email: 'zhang@abc.com',
        phone: '13800138000',
        role: '采购经理'
      }
    ]
  })
})

// 获取客户列表
const customers = await fetch('http://localhost:3001/api/customers', {
  headers: { 'Authorization': 'Bearer <token>' }
})

// 获取客户详情
const customer = await fetch('http://localhost:3001/api/customers/123', {
  headers: { 'Authorization': 'Bearer <token>' }
})
```

#### 线索管理

```typescript
// 创建线索
const lead = await fetch('http://localhost:3001/api/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    name: '新客户咨询',
    source: '官网',
    status: 'new',
    description: '对我们的产品感兴趣',
    value: 100000
  })
})

// 转化线索
await fetch('http://localhost:3001/api/leads/123/convert', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' },
  body: JSON.stringify({
    opportunity: {
      name: 'ABC 公司合作',
      stage: 'qualification',
      value: 100000
    }
  })
})
```

#### 商机管理

```typescript
// 创建商机
const opportunity = await fetch('http://localhost:3001/api/opportunities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    name: 'Q1 季度大客户',
    customerId: '123',
    value: 500000,
    stage: 'proposal',
    expectedCloseDate: '2024-03-31',
    probability: 60
  })
})

// 更新商机阶段
await fetch('http://localhost:3001/api/opportunities/123/stage', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    stage: 'negotiation',
    probability: 80
  })
})
```

#### 报表分析

```typescript
// 销售报表
const salesReport = await fetch(
  'http://localhost:3001/api/reports/sales?period=2024-Q1',
  {
    headers: { 'Authorization': 'Bearer <token>' }
  }
)

// 线索转化漏斗
const funnel = await fetch(
  'http://localhost:3001/api/reports/leads-funnel',
  {
    headers: { 'Authorization': 'Bearer <token>' }
  }
)

// 销售预测
const forecast = await fetch(
  'http://localhost:3001/api/reports/forecast?months=6',
  {
    headers: { 'Authorization': 'Bearer <token>' }
  }
)
```

## MCP 集成

CRM 通过 MCP (Model Context Protocol) 协议与 Agent 进行交互。Agent 可以通过 MCP 调用 CRM 的 API 完成自动化操作。

### MCP 服务器

CRM 内置 MCP 服务器，提供以下工具：

```typescript
// MCP 工具列表
{
  "name": "get_customer",
  "description": "获取客户信息",
  "parameters": {
    "type": "object",
    "properties": {
      "customerId": { "type": "string" }
    }
  }
}

{
  "name": "create_lead",
  "description": "创建销售线索",
  "parameters": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "source": { "type": "string" },
      "status": { "type": "string" }
    }
  }
}

{
  "name": "update_opportunity",
  "description": "更新商机信息",
  "parameters": {
    "type": "object",
    "properties": {
      "opportunityId": { "type": "string" },
      "stage": { "type": "string" },
      "probability": { "type": "number" }
    }
  }
}

{
  "name": "query_customers",
  "description": "查询客户列表",
  "parameters": {
    "type": "object",
    "properties": {
      "filter": { "type": "object" },
      "limit": { "type": "number" }
    }
  }
}
```

### Agent 使用示例

Agent 通过 MCP 调用 CRM：

```typescript
// Agent 可以执行的示例操作
"帮我查询所有本周需要跟进的客户"
// -> 调用 query_customers MCP 工具

"为 ABC 公司创建一个新的线索"
// -> 调用 create_lead MCP 工具

"更新商机 XYZ 的状态为成交阶段"
// -> 调用 update_opportunity MCP 工具
```

## 数据模型

### Customer（客户）
```typescript
interface Customer {
  id: string
  name: string
  type: 'individual' | 'company'
  industry?: string
  size?: string
  tags: string[]
  contacts: Contact[]
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  role?: string
  isPrimary: boolean
}
```

### Lead（线索）
```typescript
interface Lead {
  id: string
  name: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  customerId?: string
  assignedTo: string
  value?: number
  probability?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

### Opportunity（商机）
```typescript
interface Opportunity {
  id: string
  name: string
  customerId: string
  value: number
  stage: string
  probability: number
  expectedCloseDate: Date
  actualCloseDate?: Date
  assignedTo: string
  products?: Product[]
  createdAt: Date
  updatedAt: Date
}

interface Product {
  id: string
  name: string
  quantity: number
  price: number
}
```

### Activity（互动记录）
```typescript
interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note'
  customerId: string
  userId: string
  subject: string
  content: string
  date: Date
  duration?: number
  metadata?: Record<string, any>
  createdAt: Date
}
```

## API 接口列表

### 客户相关
- `GET /api/customers` - 客户列表
- `POST /api/customers` - 创建客户
- `GET /api/customers/:id` - 客户详情
- `PUT /api/customers/:id` - 更新客户
- `DELETE /api/customers/:id` - 删除客户
- `GET /api/customers/:id/activities` - 客户互动记录
- `GET /api/customers/:id/opportunities` - 客户商机

### 线索相关
- `GET /api/leads` - 线索列表
- `POST /api/leads` - 创建线索
- `GET /api/leads/:id` - 线索详情
- `PUT /api/leads/:id` - 更新线索
- `POST /api/leads/:id/convert` - 转化线索
- `GET /api/leads/funnel` - 线索漏斗

### 商机相关
- `GET /api/opportunities` - 商机列表
- `POST /api/opportunities` - 创建商机
- `GET /api/opportunities/:id` - 商机详情
- `PUT /api/opportunities/:id` - 更新商机
- `PUT /api/opportunities/:id/stage` - 更新商机阶段
- `DELETE /api/opportunities/:id` - 删除商机

### 任务相关
- `GET /api/tasks` - 任务列表
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务

### 报表相关
- `GET /api/reports/sales` - 销售报表
- `GET /api/reports/leads-funnel` - 线索漏斗
- `GET /api/reports/forecast` - 销售预测
- `GET /api/reports/performance` - 绩效报表

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

## 开发团队习惯

### 本地开发
```bash
# 使用 tsx watch（快速反馈）
pnpm dev

# CRM 服务运行在 http://localhost:3001
```

### 路径别名
```typescript
// 使用 @ 前缀引用
import { CustomerService } from '@/services/customer'
import { authMiddleware } from '@/middleware/auth'
```

### 平台集成
```typescript
// 使用平台认证中间件
import { authMiddleware } from '@nba/platform'

app.use(authMiddleware)
```

### MCP 服务器
```typescript
// 启动 MCP 服务器
import { MCPServer } from '@/mcp/server'

const mcpServer = new MCPServer({
  port: parseInt(process.env.MCP_PORT || '3010'),
  tools: [
    getCustomerTool,
    createLeadTool,
    updateOpportunityTool,
    queryCustomersTool
  ]
})

mcpServer.start()
```

## 安全性

- ✅ 基于 @nba/platform 的认证授权
- ✅ 数据访问权限控制
- ✅ 敏感数据加密
- ✅ 操作审计日志
- ✅ API 速率限制

## 依赖

- `express` - Web 框架
- `cors` - CORS 支持
- `@nba/platform` - 平台服务（认证授权）
- `@nba/shared` - 共享类型

## 参考资源

- [Express 文档](https://expressjs.com/)
- [CRM 最佳实践](https://www.zoho.com/crm/)
