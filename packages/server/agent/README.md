# @nba/agent

NBA 智能体（Agent）子系统 - 基于 LLM 的智能业务代理

## 技术栈

- **TypeScript** - 类型安全
- **tsx** - TypeScript 执行引擎
- **Anthropic SDK** - Claude API 集成
- **OpenAI SDK** - OpenAI API 集成（备用）

## 功能特性

- 🤖 智能对话与理解
- 📊 数据分析与洞察
- 🔍 业务流程自动化
- 🎯 决策支持
- 📝 文档生成与处理
- 🔌 多模型支持
- 🔌 MCP 协议集成（调用 CRM/ERP）

## 目录结构

```
agent/
├── src/
│   ├── index.ts          # 入口文件
│   ├── core/             # 核心引擎
│   │   ├── agent.ts      # Agent 基类
│   │   ├── context.ts    # 上下文管理
│   │   └── memory.ts     # 记忆系统
│   ├── tools/            # 工具集
│   │   ├── data.ts       # 数据查询
│   │   ├── analysis.ts   # 数据分析
│   │   └── generator.ts  # 生成工具
│   ├── mcp/              # MCP 集成
│   │   ├── client.ts     # MCP 客户端
│   │   ├── crm.ts        # CRM MCP 连接
│   │   └── erp.ts        # ERP MCP 连接
│   ├── prompts/          # 提示词模板
│   │   ├── system.ts
│   │   └── templates/
│   └── types/            # 类型定义
│       └── agent.ts
├── package.json
├── tsconfig.json
└── tsconfig.paths.json   # 路径别名配置
```

## 安装

```bash
pnpm install
```

## 配置

创建环境配置文件 `.env` 或 `.env.local`：

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# OpenAI API（备用）
OPENAI_API_KEY=your_openai_api_key

# 默认模型
MODEL_DEFAULT=claude-3-sonnet-20240229

# Agent 配置
AGENT_MAX_TOKENS=4096
AGENT_TEMPERATURE=0.7

# MCP 服务配置
MCP_CRM_URL=http://localhost:3010
MCP_ERP_URL=http://localhost:3011
```

## 使用

### 基础使用

```typescript
import { Agent } from '@nba/agent'

const agent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-sonnet-20240229'
})

const response = await agent.chat('分析这个季度的销售数据')
console.log(response.content)
```

### 带上下文的对话

```typescript
import { Agent, Context } from '@nba/agent'

const context = new Context({
  userId: 'user-123',
  session: {
    history: [
      { role: 'user', content: '我的订单状态' },
      { role: 'assistant', content: '已发货' }
    ]
  }
})

const agent = new Agent({ context })
await agent.chat('预计什么时候送达')
```

### 使用工具

```typescript
import { Agent, Tools } from '@nba/agent'

const agent = new Agent({
  tools: [
    new Tools.DataQuery(),
    new Tools.Analysis(),
    new Tools.ReportGenerator()
  ]
})

const response = await agent.chat('生成本周的销售报告')
```

### MCP 集成

Agent 通过 MCP (Model Context Protocol) 协议与 CRM 和 ERP 进行交互：

```typescript
import { Agent } from '@nba/agent'
import { CRMClient, ERPClient } from '@nba/agent/mcp'

// 创建 MCP 客户端
const crmClient = new CRMClient({
  url: process.env.MCP_CRM_URL
})

const erpClient = new ERPClient({
  url: process.env.MCP_ERP_URL
})

// 创建 Agent 并注册 MCP 工具
const agent = new Agent({
  tools: [
    ...crmClient.getTools(),
    ...erpClient.getTools(),
    new Tools.ReportGenerator()
  ]
})

// Agent 可以自动调用 CRM/ERP 的工具
const response = await agent.chat('帮我查询 ABC 公司的客户信息并检查库存')
```

### 使用 MCP 工具

```typescript
// 直接调用 CRM 工具
const customer = await crmClient.call('get_customer', {
  customerId: 'cust-123'
})

// 直接调用 ERP 工具
const inventory = await erpClient.call('get_inventory', {
  productId: 'prod-001'
})

// Agent 自动选择合适的工具
const result = await agent.chat('创建一个销售线索给 XYZ 公司')
// Agent 会自动调用 CRM 的 create_lead 工具
```

## Agent 类型

### 1. 问答 Agent（QA Agent）

```typescript
import { QAAgent } from '@nba/agent'

const qaAgent = new QAAgent({
  knowledgeBase: '/path/to/knowledge',
  model: 'claude-3-haiku-20240307'
})

const answer = await qaAgent.ask('如何退款？')
```

### 2. 数据分析 Agent

```typescript
import { AnalysisAgent } from '@nba/agent'

const analysisAgent = new AnalysisAgent({
  dataSource: 'database',
  capabilities: ['trend', 'anomaly', 'prediction']
})

const insight = await analysisAgent.analyze({
  type: 'trend',
  dataset: 'sales',
  period: 'last-30-days'
})
```

### 3. 工作流 Agent

```typescript
import { WorkflowAgent } from '@nba/agent'

const workflow = new WorkflowAgent({
  steps: [
    'validate-input',
    'process-data',
    'generate-report',
    'send-notification'
  ]
})

await workflow.execute({
  inputData: {...}
})
```

## 工具（Tools）

### 数据工具
- `DataQuery` - 数据库查询
- `APICall` - API 调用
- `FileRead` - 文件读取

### 分析工具
- `Analysis` - 数据分析
- `TrendDetection` - 趋势检测
- `AnomalyDetection` - 异常检测

### 生成工具
- `ReportGenerator` - 报告生成
- `ChartGenerator` - 图表生成
- `DocumentGenerator` - 文档生成

### MCP 工具（自动从 CRM/ERP 获取）
- CRM 工具：`get_customer`, `create_lead`, `update_opportunity`, `query_customers` 等
- ERP 工具：`get_inventory`, `create_procurement_order`, `query_production_orders` 等

## 提示词模板

### 系统提示词

```typescript
const systemPrompt = `
你是一个专业的业务助手，专注于以下任务：
- 回答业务相关问题
- 分析数据和趋势
- 生成业务报告
- 提供建议和决策支持

请使用专业、准确、有帮助的语言回复。
`
```

### 用户提示词模板

```typescript
const templates = {
  report: '生成{{period}}的{{type}}报告，重点关注{{focus}}',
  analysis: '分析{{metric}}在过去{{period}}的变化趋势',
  summary: '总结{{dataset}}的关键指标和洞察'
}
```

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

## tsx 开发体验

tsx 是一个极快的 TypeScript 执行器，开发体验优于 ts-node：

```bash
# 直接运行 TypeScript
tsx src/index.ts

# 监听模式
tsx watch src/index.ts

# 类 Node.js REPL
tsx
```

## 开发团队习惯

### 本地开发
```bash
# 使用 tsx 直接运行（快速反馈）
tsx watch src/index.ts

# 或通过 pnpm 脚本
pnpm dev
```

### 调试
```bash
# 使用 tsx + inspect
tsx --inspect src/index.ts

# 使用 VSCode 调试器
# 配置 .vscode/launch.json
```

### 路径别名

在 `tsconfig.paths.json` 中配置路径别名：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@tools/*": ["src/tools/*"]
    }
  }
}
```

使用时：

```typescript
import { Agent } from '@core/agent'
import { DataQuery } from '@tools/data'
```

构建时使用 `tsc-alias` 转换路径别名：

```bash
pnpm build  # 执行 tsc && tsc-alias
```

## 最佳实践

### 1. 上下文管理
- 合理设置上下文窗口大小
- 及时清理不必要的历史对话
- 使用分层记忆系统

### 2. 工具选择
- 根据任务复杂度选择合适的工具
- 避免过度调用工具
- 优化工具执行效率

### 3. 提示词工程
- 清晰明确地描述任务
- 提供必要的示例
- 使用结构化输出格式

### 4. 性能优化
- 缓存常用查询结果
- 批量处理相似请求
- 异步执行耗时操作

### 5. 错误处理
```typescript
try {
  const response = await agent.chat('query')
} catch (error) {
  if (error instanceof RateLimitError) {
    // 处理速率限制
  } else if (error instanceof InvalidRequestError) {
    // 处理无效请求
  } else {
    // 通用错误处理
  }
}
```

## 安全性

- ✅ API 密钥加密存储
- ✅ 敏感数据过滤
- ✅ 访问权限控制
- ✅ 操作日志记录

## 成本控制

```typescript
const agent = new Agent({
  maxTokens: 4096,
  temperature: 0.7,
  costLimit: 100, // 每月美元
  enableCache: true
})
```

## 依赖

- `@anthropic-ai/sdk` - Claude API
- `openai` - OpenAI API
- `@nba/shared` - 共享类型
- `@modelcontextprotocol/sdk` - MCP SDK
- `tsx` - TypeScript 执行引擎
- `tsc-alias` - 路径别名转换

## 参考资源

- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [tsx 文档](https://esbuild.github.io/content-type/tsx/)
