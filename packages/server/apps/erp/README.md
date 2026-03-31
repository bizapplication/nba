# @nba/erp

NBA 业务应用：ERP 企业资源规划子系统

## 技术栈

- **TypeScript** - 类型安全
- **Express** - Web 框架
- **@nba/platform** - 身份认证与权限
- **MCP 协议** - 与 Agent 交互

## 功能特性

### 供应链管理
- 📦 库存管理
- 🔗 供应商管理
- 📋 采购订单
- 🚚 物流追踪
- 📊 库存预警

### 财务管理
- 💰 应收应付
- 📒 账务处理
- 📊 财务报表
- 💵 发票管理
- 🏦 银行对账

### 生产管理
- 🏭 生产计划
- ⚙️ 工单管理
- 📦 物料需求
- ⏱️ 生产排程
- 📈 产能分析

### 人力资源
- 👤 员工管理
- 📅 考勤管理
- 💰 薪资管理
- 📊 绩效评估
- 🎯 培训发展

### 资产管理
- 🏢 固定资产
- 🔧 设备维护
- 📊 资产折旧
- 🏷️ 资产盘点
- 🔒 资产追踪

### 报表分析
- 📊 业务报表
- 📈 趋势分析
- 🔮 预测分析
- 📱 仪表盘
- 📄 导出功能

## 目录结构

```
erp/
├── src/
│   ├── index.ts          # 入口文件
│   ├── app.ts            # Express 应用
│   ├── routes/           # API 路由
│   │   ├── inventory.ts
│   │   ├── procurement.ts
│   │   ├── finance.ts
│   │   ├── production.ts
│   │   ├── hr.ts
│   │   ├── assets.ts
│   │   └── reports.ts
│   ├── services/         # 业务逻辑
│   │   ├── inventory.ts
│   │   ├── procurement.ts
│   │   ├── finance.ts
│   │   ├── production.ts
│   │   ├── hr.ts
│   │   └── analytics.ts
│   ├── controllers/      # 控制器
│   ├── models/           # 数据模型
│   │   ├── product.ts
│   │   ├── inventory.ts
│   │   ├── order.ts
│   │   └── finance.ts
│   ├── middleware/       # 中间件
│   │   └── auth.ts       # 平台认证中间件
│   └── types/            # 类型定义
│       └── erp.ts
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
PORT=3002
HOST=0.0.0.0
NODE_ENV=development

# 平台服务配置
PLATFORM_API_URL=http://localhost:3000
PLATFORM_API_KEY=your_api_key

# MCP 配置
MCP_SERVER_ENABLED=true
MCP_PORT=3011

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/nba_erp
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

服务运行在 `http://localhost:3002`

### API 使用示例

#### 库存管理

```typescript
// 添加库存
const inventory = await fetch('http://localhost:3002/api/inventory', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    productId: 'prod-123',
    warehouseId: 'wh-001',
    quantity: 100,
    unit: 'pcs'
  })
})

// 库存盘点
const stocktake = await fetch('http://localhost:3002/api/inventory/stocktake', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    warehouseId: 'wh-001',
    items: [
      { productId: 'prod-001', actualQuantity: 95 },
      { productId: 'prod-002', actualQuantity: 150 }
    ]
  })
})

// 库存预警查询
const alerts = await fetch('http://localhost:3002/api/inventory/alerts', {
  headers: { 'Authorization': 'Bearer <token>' }
})
```

#### 采购管理

```typescript
// 创建采购订单
const order = await fetch('http://localhost:3002/api/procurement/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    supplierId: 'sup-001',
    items: [
      { productId: 'prod-001', quantity: 50, price: 10 },
      { productId: 'prod-002', quantity: 30, price: 20 }
    ],
    deliveryDate: '2024-04-15',
    notes: '紧急采购'
  })
})

// 审批采购订单
await fetch('http://localhost:3002/api/procurement/orders/123/approve', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' },
  body: JSON.stringify({
    approved: true,
    comment: '已确认'
  })
})
```

#### 财务管理

```typescript
// 创建发票
const invoice = await fetch('http://localhost:3002/api/finance/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    customerId: 'cust-001',
    type: 'ar', // 应收
    items: [
      { description: '商品 A', quantity: 10, price: 100 },
      { description: '商品 B', quantity: 5, price: 200 }
    ],
    dueDate: '2024-04-30'
  })
})

// 生成财务报表
const report = await fetch(
  'http://localhost:3002/api/finance/reports?period=2024-Q1&type=profit-loss',
  {
    headers: { 'Authorization': 'Bearer <token>' }
  }
)
```

#### 生产管理

```typescript
// 创建生产工单
const workOrder = await fetch('http://localhost:3002/api/production/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    productId: 'prod-001',
    quantity: 1000,
    dueDate: '2024-04-20',
    priority: 'high',
    notes: '紧急订单'
  })
})

// 更新生产进度
await fetch('http://localhost:3002/api/production/orders/123/progress', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    status: 'in-progress',
    completedQuantity: 500,
    notes: '生产进行中'
  })
})
```

#### 人力资源管理

```typescript
// 员工入职
const employee = await fetch('http://localhost:3002/api/hr/employees', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    name: '张三',
    department: '研发部',
    position: '软件工程师',
    startDate: '2024-04-01',
    salary: 15000,
    email: 'zhangsan@company.com'
  })
})

// 考勤记录
const attendance = await fetch('http://localhost:3002/api/hr/attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    employeeId: 'emp-001',
    date: '2024-03-31',
    checkIn: '09:00',
    checkOut: '18:00',
    status: 'present'
  })
})
```

## MCP 集成

ERP 通过 MCP (Model Context Protocol) 协议与 Agent 进行交互。Agent 可以通过 MCP 调用 ERP 的 API 完成自动化操作。

### MCP 服务器

ERP 内置 MCP 服务器，提供以下工具：

```typescript
// MCP 工具列表
{
  "name": "get_inventory",
  "description": "获取库存信息",
  "parameters": {
    "type": "object",
    "properties": {
      "productId": { "type": "string" },
      "warehouseId": { "type": "string" }
    }
  }
}

{
  "name": "create_procurement_order",
  "description": "创建采购订单",
  "parameters": {
    "type": "object",
    "properties": {
      "supplierId": { "type": "string" },
      "items": { "type": "array" }
    }
  }
}

{
  "name": "query_production_orders",
  "description": "查询生产工单",
  "parameters": {
    "type": "object",
    "properties": {
      "status": { "type": "string" },
      "dueDate": { "type": "string" }
    }
  }
}

{
  "name": "generate_finance_report",
  "description": "生成财务报表",
  "parameters": {
    "type": "object",
    "properties": {
      "period": { "type": "string" },
      "type": { "type": "string" }
    }
  }
}
```

### Agent 使用示例

Agent 通过 MCP 调用 ERP：

```typescript
// Agent 可以执行的示例操作
"帮我查询产品 A 的库存情况"
// -> 调用 get_inventory MCP 工具

"创建一个采购订单，从供应商 B 购买产品 C"
// -> 调用 create_procurement_order MCP 工具

"生成本月的生产报表"
// -> 调用 generate_finance_report MCP 工具
```

## 数据模型

### Product（产品）
```typescript
interface Product {
  id: string
  code: string
  name: string
  category: string
  unit: string
  price: number
  cost: number
  description?: string
  specifications?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

### Inventory（库存）
```typescript
interface Inventory {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  reservedQuantity: number
  unitCost: number
  location?: string
  lastUpdated: Date
}
```

### ProcurementOrder（采购订单）
```typescript
interface ProcurementOrder {
  id: string
  supplierId: string
  orderNumber: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed'
  items: OrderItem[]
  totalAmount: number
  deliveryDate: Date
  createdAt: Date
  updatedAt: Date
}

interface OrderItem {
  productId: string
  quantity: number
  price: number
}
```

### WorkOrder（生产工单）
```typescript
interface WorkOrder {
  id: string
  orderNumber: string
  productId: string
  quantity: number
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: Date
  completedQuantity: number
  createdAt: Date
  updatedAt: Date
}
```

### Employee（员工）
```typescript
interface Employee {
  id: string
  name: string
  employeeNumber: string
  department: string
  position: string
  email: string
  phone?: string
  salary: number
  startDate: Date
  status: 'active' | 'inactive' | 'terminated'
  createdAt: Date
  updatedAt: Date
}
```

## API 接口列表

### 库存相关
- `GET /api/inventory` - 库存列表
- `POST /api/inventory` - 添加库存
- `GET /api/inventory/:id` - 库存详情
- `PUT /api/inventory/:id` - 更新库存
- `POST /api/inventory/stocktake` - 库存盘点
- `GET /api/inventory/alerts` - 库存预警
- `GET /api/warehouses` - 仓库列表

### 采购相关
- `GET /api/procurement/orders` - 采购订单列表
- `POST /api/procurement/orders` - 创建采购订单
- `GET /api/procurement/orders/:id` - 订单详情
- `PUT /api/procurement/orders/:id/approve` - 审批订单
- `GET /api/procurement/suppliers` - 供应商列表

### 财务相关
- `GET /api/finance/invoices` - 发票列表
- `POST /api/finance/invoices` - 创建发票
- `GET /api/finance/accounts` - 账户列表
- `GET /api/finance/reports` - 财务报表
- `GET /api/finance/transactions` - 交易记录

### 生产相关
- `GET /api/production/orders` - 生产工单列表
- `POST /api/production/orders` - 创建工单
- `PUT /api/production/orders/:id/progress` - 更新进度
- `GET /api/production/schedule` - 生产排程
- `GET /api/production/capacity` - 产能分析

### 人力资源相关
- `GET /api/hr/employees` - 员工列表
- `POST /api/hr/employees` - 新增员工
- `GET /api/hr/attendance` - 考勤记录
- `POST /api/hr/attendance` - 考勤打卡
- `GET /api/hr/payroll` - 薪资记录
- `GET /api/hr/departments` - 部门列表

### 资产相关
- `GET /api/assets` - 资产列表
- `POST /api/assets` - 新增资产
- `GET /api/assets/:id` - 资产详情
- `PUT /api/assets/:id` - 更新资产

### 报表相关
- `GET /api/reports/inventory` - 库存报表
- `GET /api/reports/procurement` - 采购报表
- `GET /api/reports/finance` - 财务报表
- `GET /api/reports/production` - 生产报表
- `GET /api/reports/hr` - 人力资源报表

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

# ERP 服务运行在 http://localhost:3002
```

### 路径别名
```typescript
// 使用 @ 前缀引用
import { InventoryService } from '@/services/inventory'
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
  port: parseInt(process.env.MCP_PORT || '3011'),
  tools: [
    getInventoryTool,
    createProcurementOrderTool,
    queryProductionOrdersTool,
    generateFinanceReportTool
  ]
})

mcpServer.start()
```

## 安全性

- ✅ 基于 @nba/platform 的认证授权
- ✅ 数据访问权限控制
- ✅ 敏感财务数据加密
- ✅ 操作审计日志
- ✅ API 速率限制

## 依赖

- `express` - Web 框架
- `cors` - CORS 支持
- `@nba/platform` - 平台服务（认证授权）
- `@nba/shared` - 共享类型

## 参考资源

- [Express 文档](https://expressjs.com/)
- [ERP 最佳实践](https://www.gartner.com/en/information-technology/topics/erp)
