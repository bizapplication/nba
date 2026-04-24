# NBA

下一代业务应用（Next Generation Business Application）- 基于 AI 的企业级业务平台

## 项目概述

NBA 是一个现代化的企业运营管理操作系统，集成了 CRM、ERP 等核心业务系统，并通过 AI Agent 提供智能分析和决策支持。

## 技术栈

### 前端技术
- **Nuxt 3** - Vue 元框架
- **Vue 3** - UI 框架
- **@nuxt/ui** - Nuxt UI 组件库（基于 Headless UI + Tailwind CSS）
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Tauri** - 桌面应用框架

### 后端技术
- **Node.js** - 运行环境
- **TypeScript** - 类型安全
- **Express** - Web 框架
- **JWT** - 认证方案

### 开发工具
- **Bun** - CLI 工具运行时
- **tsx** - 服务端 TypeScript 执行引擎
- **Vite** - 构建工具
- **pnpm** - 包管理器（Monorepo）
- **Turborepo** - 构建工具

### AI 技术
- **Anthropic Claude** - 智能分析
- **OpenAI API** - AI 能力补充

## 目录结构

```
nba/
├── apps/                      # 应用层
│   ├── cli/                  # 命令行工具（Bun 运行时）
│   ├── desktop/              # 桌面应用（Tauri + Vue）
│   └── web/                  # Web 应用（Nuxt 3 + @nuxt/ui）
│
├── packages/                  # 共享包层
│   ├── shared/               # 共享类型与工具
│   ├── ui/                   # UI 组件库（Vue 3 + Tailwind）
│   └── server/               # 服务端（Express 框架）
│       ├── agent/            # AI Agent（tsx 运行时）
│       ├── platform/         # 平台服务（IAM + 技能市场）
│       └── apps/             # 业务应用
│           ├── crm/          # CRM 系统
│           └── erp/          # ERP 系统
│
├── package.json              # 根级配置
├── pnpm-workspace.yaml       # pnpm 工作空间
├── turbo.json               # Turborepo 配置
└── README.md
```

## 系统架构

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        展示层（Presentation Layer）         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web 应用    │  │  桌面应用    │  │  CLI 工具    │     │
│  │  (Nuxt 3)    │  │  (Tauri)     │  │  (Bun)       │     │
│  │  @nba/web    │  │ @nba/desktop │  │  @nba/cli   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                 │                                    │
└─────────┼─────────────────┼──────────────────────────────────┘
          │                 │
          └────────┬────────┘
                   │
┌──────────────────┼──────────────────────────────────────────┐
│              Agent 层（AI 智能层）                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               AI Agent (@nba/agent)                 │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │  Claude / OpenAI LLM                       │   │  │
│  │  │  - 智能对话与理解                           │   │  │
│  │  │  - 数据分析与洞察                           │   │  │
│  │  │  - 决策支持与自动化                         │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │  MCP 客户端（Model Context Protocol）        │   │  │
│  │  │  - CRM MCP Client                           │   │  │
│  │  │  - ERP MCP Client                           │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          │ MCP 协议调用                      │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│         业务应用层（Application Layer）                       │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   CRM 系统         │  │   ERP 系统         │          │
│  │   @nba/crm         │  │   @nba/erp         │          │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │          │
│  │  │ 客户管理      │  │  │  │ 库存管理      │  │          │
│  │  │ 线索管理      │  │  │  │ 财务管理      │  │          │
│  │  │ 商机管理      │  │  │  │ 生产管理      │  │          │
│  │  └───────────────┘  │  │  │ 人力资源      │  │          │
│  │  ┌───────────────┐  │  │  └───────────────┘  │          │
│  │  │  MCP 服务器   │  │  │  ┌───────────────┐  │          │
│  │  │  - 工具定义   │  │  │  │  MCP 服务器   │  │          │
│  │  │  - 数据查询   │  │  │  │  - 工具定义   │  │          │
│  │  │  - 业务操作   │  │  │  │  - 数据查询   │  │          │
│  │  └───────────────┘  │  │  │  - 业务操作   │  │          │
│  └─────────────────────┘  │  └───────────────┘  │          │
└──────────────────────────┴──────────────────────┘          │
                           │ 依赖                             │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│         平台服务层（Platform Layer）                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Platform Service (@nba/platform)             │  │
│  │  ┌─────────────┐  ┌─────────────────────────────┐   │  │
│  │  │  IAM 服务   │  │      技能市场                │   │  │
│  │  │  - 身份认证 │  │  - 技能商店                  │   │  │
│  │  │  - 权限控制 │  │  - 评分评论                  │   │  │
│  │  │  - 会话管理 │  │  - 安装管理                  │   │  │
│  │  └─────────────┘  └─────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

**架构说明：**
- **展示层**: Web、Desktop、CLI 提供用户交互界面
- **Agent 层**: AI 智能体，通过 MCP 协议调用业务系统
- **业务应用层**: CRM、ERP 提供具体业务功能，内置 MCP 服务器
- **平台服务层**: Platform 提供底层认证授权、技能市场等公共服务

### 依赖关系

```
@nba/shared (被所有包依赖)
    ↑
    │
    ├─ @nba/platform ───────────────────┐
    │   ↑                               │
    │   │                               │
    │   ├─ @nba/crm ────────────────┐  │
    │   ├─ @nba/erp ────────────────┤  │
    │   │                            │  │
    │   │                            │  │
    │   │                            │  │
    ├─ @nba/agent ◀─────────────────┘  │
    │                                   │
    ├─ @nba/ui                          │
    │   ↑                               │
    │   ├─ @nba/web                     │
    │   └─ @nba/desktop                 │
    │                                   │
    └─ @nba/cli                         │
```

**说明：**
- **@nba/shared**: 被所有包依赖，提供共享类型和工具
- **@nba/platform**: 依赖 @nba/shared，提供身份认证（IAM）和技能市场服务
- **@nba/crm/@nba/erp**: 依赖 @nba/shared 和 @nba/platform，提供各自的业务 API 和 MCP 服务器
- **@nba/agent**: 依赖 @nba/shared，独立的 AI 智能体，通过 MCP 协议调用 CRM/ERP 的功能
- **@nba/ui**: 依赖 @nba/shared，UI 组件库
- **@nba/web/@nba/desktop**: 依赖 @nba/shared 和 @nba/ui，前端应用，调用 Agent API 提供对话界面
- **@nba/cli**: 依赖 @nba/shared，命令行工具，独立运行

### MCP 协议集成

Agent 通过 MCP (Model Context Protocol) 与 CRM/ERP 交互：

```
Web/Desktop
    ↓ (HTTP/WebSocket)
Agent API
    ↓ (MCP 协议)
CRM MCP Server ────────────── CRM 业务逻辑
ERP MCP Server ────────────── ERP 业务逻辑
```

**交互流程：**
1. 用户在 Web/Desktop 中发起对话请求
2. Agent 接收请求，理解用户意图
3. Agent 通过 MCP 客户端调用 CRM/ERP 的工具
4. CRM/ERP 的 MCP 服务器执行业务操作
5. Agent 整合结果，返回给用户

## 快速开始

### 环境要求

- **Node.js** >= 24.0.0
- **pnpm** >= 9.0.0
- **git** >= 2.39
- **Docker Desktop**（本地 Demo 使用 PostgreSQL）
- **Bun** >= 1.0.0（用于 CLI）
- **Rust** >= 1.70.0（用于 Tauri）

### macOS 本地 OpenClaw Demo

这套仓库现在支持一条面向 **macOS 本地演示** 的启动链路：Web `/home` 会接通本地 Platform、Agent API、CRM、ERP 和项目自带的 OpenClaw sidecar。登录后即可演示真实 run、审批卡、本地文件操作和浏览器动作。

```bash
cp .env.example .env
pnpm demo:setup
pnpm demo:start
```

默认约束：

- 仅支持 **macOS**
- 需要 `OPENAI_API_KEY` 和 `OPENCLAW_GATEWAY_TOKEN`
- OpenClaw 运行时会放在 `.runtime/openclaw/`
- OpenClaw 本地状态会隔离在 `.runtime/openclaw-home/`
- 平台和 Agent 的持久化数据会放在 `.data/`
- 上传附件会落到 `demo-files/uploads/`

常用命令：

```bash
# 环境预检查
pnpm demo:doctor

# 初始化 OpenClaw sidecar、本地数据库和演示数据
pnpm demo:setup

# 启动 OpenClaw + Platform + Agent + CRM + ERP + Web
pnpm demo:start

# 重新灌入 CRM 演示数据
pnpm demo:seed

# 停掉本地 Demo 相关进程
pnpm demo:stop
```

默认端口：

- Web: `http://127.0.0.1:3000`
- CRM API: `http://127.0.0.1:3002`
- Platform: `http://127.0.0.1:3003`
- Agent API: `http://127.0.0.1:3004`
- ERP: `http://127.0.0.1:3101`
- OpenClaw Gateway: `http://127.0.0.1:18789`

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动 Web 应用
pnpm dev:web

# 启动 macOS 本地 OpenClaw Demo
pnpm demo:setup
pnpm demo:start

# 一键启动 CRM Web 联调环境（PostgreSQL + CRM API + Web）
pnpm dev:crm:web

# 向 CRM 注入演示数据
pnpm seed:crm:demo

# 启动桌面应用
pnpm dev:desktop

# 启动服务端（Platform + Agent + CRM + ERP）
pnpm dev:server

# 启动 CLI 工具
pnpm dev:cli
```

`pnpm dev:crm:web` 默认会把 CRM 联调环境起在：

- Web: `http://127.0.0.1:3000/crm`
- CRM API: `http://127.0.0.1:3002`
- PostgreSQL: `127.0.0.1:5433`

如需切换端口或数据库连接，可在启动前覆盖 `WEB_PORT`、`CRM_PORT`、`CRM_DB_PORT`、`CRM_DB_USER` 等环境变量。

`pnpm seed:crm:demo` 使用同一组 `CRM_DB_*` 环境变量，适合在本地 CRM 数据库里快速补齐客户、商机、订单演示数据。

### 构建

```bash
# 构建 Web 应用
pnpm build:web

# 构建桌面应用
pnpm build:desktop

# 构建 CLI 工具
pnpm build:cli

# 预览 Web 应用
pnpm preview:web
```

### 测试与代码检查

```bash
# 运行所有测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck
```

## 子项目介绍

### @nba/cli
命令行工具，用于项目初始化、代码生成和系统管理。

- **运行时**: Bun（快速启动和执行）
- **技术**: TypeScript + Commander.js + Chalk

### @nba/desktop
基于 Tauri 的跨平台桌面应用，提供离线工作能力。

- **框架**: Tauri + Vue 3
- **特点**: 更小的安装包，更好的性能

### @nba/web
基于 Nuxt 3 的 Web 应用，提供现代化的用户界面。

- **框架**: Nuxt 3 + Vue 3
- **UI**: @nuxt/ui（Headless UI + Tailwind CSS）
- **特性**: SSR/SSG，自动导入，组件库

### @nba/shared
前后端共享的 TypeScript 类型和工具函数库。

- **构建**: Vite
- **验证**: Zod
- **用途**: 统一的类型定义和工具函数

### @nba/ui
基于 Vue 3 和 Tailwind CSS 的 UI 组件库。

- **框架**: Vue 3 + Tailwind CSS
- **构建**: Vite
- **图标**: lucide-vue-next
- **变体**: class-variance-authority

### @nba/agent
AI Agent 子系统，提供智能分析和决策支持能力。Agent 作为独立入口，通过 MCP 协议调用 CRM/ERP 的功能。

- **运行时**: tsx（TypeScript 执行引擎）
- **AI**: Anthropic Claude + OpenAI（备用）
- **集成**: MCP 协议（与 CRM/ERP 交互）
- **功能**: 智能对话、数据分析、自动化操作、报告生成

### @nba/platform
平台服务，包含身份认证（IAM）和技能市场。

- **框架**: Express
- **认证**: JWT + bcryptjs
- **功能**: 用户管理、权限控制、技能商店

### @nba/crm
客户关系管理系统，包含客户管理、线索管理、商机管理等。CRM 提供 REST API 和 MCP 服务器供 Agent 调用。

- **框架**: Express
- **依赖**: @nba/platform（认证授权）
- **集成**: MCP 服务器（供 Agent 调用）
- **功能**: 客户档案、线索跟进、商机管理、报表分析

### @nba/erp
企业资源规划系统，包含供应链、财务、生产、人力资源等模块。ERP 提供 REST API 和 MCP 服务器供 Agent 调用。

- **框架**: Express
- **依赖**: @nba/platform（认证授权）
- **集成**: MCP 服务器（供 Agent 调用）
- **功能**: 库存管理、采购、财务、生产、HR、资产管理

## 功能特性

### 🤖 AI 驱动
- 智能数据分析与洞察
- 自动化业务流程（通过 MCP）
- 智能推荐与决策支持
- 自然语言交互与操作
- 多模型支持（Claude/OpenAI）

### 🔄 全渠道支持
- Web 浏览器（Nuxt 3）
- 桌面应用（Tauri）
- 命令行工具（Bun）

### 🏢 业务一体化
- CRM 客户关系管理
- ERP 企业资源规划
- 统一身份认证
- 技能市场生态

### 🚀 现代化架构
- Monorepo 管理（pnpm workspaces）
- TypeScript 全栈
- 组件化开发（Vue 3）
- 高性能构建（Turborepo + Vite）

## 开发指南

### 代码规范

```bash
# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

### 添加新包

1. 在 `apps/` 或 `packages/` 下创建新目录
2. 初始化 `package.json`
3. 在 `pnpm-workspace.yaml` 中添加路径
4. 更新根 `package.json` 中的脚本

### 技术栈选择理由

#### Bun vs Node.js（CLI）
- Bun 提供更快的启动速度和更好的性能
- 原生支持 ES Modules 和 TypeScript
- 内置测试运行器和打包工具

#### Tauri vs Electron（Desktop）
- 更小的安装包（~10MB vs ~100MB+）
- 更低的内存占用
- 更快的启动速度
- Rust 后端提供原生性能

#### Nuxt 3 vs Next.js（Web）
- 团队更熟悉 Vue 生态
- Nuxt 3 提供开箱即用的功能
- @nuxt/ui 提供完整的组件库

#### Express vs Fastify（Server）
- 更广泛的社区支持
- 丰富的中间件生态
- 团队熟悉度更高

## 部署

### 生产构建

```bash
# 构建共享包
pnpm --filter @nba/shared build
pnpm --filter @nba/ui build

# 构建服务端
pnpm --filter @nba/agent build
pnpm --filter @nba/platform build
pnpm --filter @nba/crm build
pnpm --filter @nba/erp build

# 构建应用
pnpm build:web
pnpm build:desktop
pnpm build:cli
```

### 环境变量

创建 `.env.local` 文件：

```env
# API 配置
NEXT_PUBLIC_API_URL=http://api.domain.com
DATABASE_URL=postgresql://...

# AI 服务
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
GLM_API_KEY=your_key

# 认证服务
JWT_SECRET=your_secret
```

### Docker 部署

```dockerfile
# Web 应用
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build:web
EXPOSE 3000
CMD ["pnpm", "preview:web"]
```

## 团队协作

### Git 工作流

```bash
# 创建特性分支
git checkout -b feature/amazing-feature

# 提交更改
git add .
git commit -m "feat: add amazing feature"

# 推送分支
git push origin feature/amazing-feature

# 创建 Pull Request
# 在 GitHub/GitLab 上创建 PR
```

### 代码审查

- 所有代码需要通过 PR 审查
- 确保 `pnpm lint` 和 `pnpm typecheck` 通过
- 运行 `pnpm test` 确保测试通过

### 文档

- 重要功能需要更新文档
- API 变更需要更新接口文档
- 新增组件需要添加使用示例

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 [LICENSE](LICENSE) 许可证。

## 联系方式

- 项目主页：https://github.com/bizapplication/nba
- 问题反馈：https://github.com/bizapplication/nba/issues
- 邮箱：raozhangwen@gmail.com

## 技术参考

- [Nuxt 3 文档](https://nuxt.com/)
- [Vue 3 文档](https://vuejs.org/)
- [@nuxt/ui 文档](https://ui.nuxt.com/)
- [Tauri 文档](https://tauri.app/)
- [Express 文档](https://expressjs.com/)
- [Bun 文档](https://bun.sh/)
- [pnpm 文档](https://pnpm.io/)
- [Turborepo 文档](https://turbo.build/)
