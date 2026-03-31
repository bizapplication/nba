# @nba/cli

NBA 命令行工具 - 用于快速执行系统管理任务和开发调试

## 技术栈

- **Bun** - TypeScript 运行时（替代 Node.js）
- **TypeScript** - 类型安全的开发体验
- **Commander.js** - 命令行参数解析
- **Chalk** - 终端彩色输出

## 功能特性

- 🚀 快速项目初始化与脚手架
- 🔧 代码生成工具
- 📊 项目状态检查
- 📦 依赖管理与版本控制
- 🧪 测试与构建命令

## 目录结构

```
cli/
├── src/
│   ├── index.ts          # 入口文件
│   ├── commands/         # 命令实现
│   │   ├── init.ts
│   │   ├── generate.ts
│   │   └── status.ts
│   └── utils/            # 工具函数
├── package.json
└── tsconfig.json
```

## 安装

```bash
# 开发模式
pnpm install

# 全局安装（构建后）
pnpm build
pnpm link --global
```

## 使用

```bash
# 开发模式运行
pnpm dev

# 构建生产版本
pnpm build

# 运行构建后的可执行文件
bun run dist/index.js
```

### 命令示例

```bash
# 查看帮助
nba --help

# 初始化项目
nba init

# 生成代码
nba generate component MyComponent

# 查看项目状态
nba status

# 清理构建缓存
nba clean

# 显示版本信息
nba --version
```

## 开发

```bash
# 使用 Bun 直接运行
bun run src/index.ts

# 监听模式（通过 pnpm）
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

## Bun 特性

### 性能优势
- ⚡️ 比 Node.js 更快的启动速度
- 🚀 原生支持 ES Modules
- 🔧 内置测试运行器
- 📦 原生打包工具

### 构建命令

```bash
# Bun 原生打包
bun build src/index.ts \
  --target bun \
  --outfile nba \
  --compile

# 生成可执行文件
bun build src/index.ts \
  --target node \
  --outfile dist/nba.js
```

## 开发团队习惯

### 本地开发
```bash
# 使用 Bun 直接运行（推荐，快速反馈）
bun run src/index.ts

# 或使用 pnpm 脚本
pnpm dev
```

### 测试
```bash
# 使用 Bun 内置测试
bun test

# 或通过 pnpm
pnpm test
```

### 构建与发布
```bash
# 构建生产版本
pnpm build

# 生成可执行文件（跨平台）
bun build src/index.ts --compile --outfile nba
```

## 命令列表

| 命令 | 描述 |
|------|------|
| `init [name]` | 初始化新项目 |
| `generate <type> <name>` | 生成代码文件（component, page, service 等） |
| `status` | 查看项目状态 |
| `clean` | 清理构建缓存 |
| `version` | 显示版本信息 |
| `upgrade` | 升级项目依赖 |

## 环境要求

- Bun >= 1.0.0
- pnpm >= 9.0.0
- TypeScript >= 5.3.0

## 最佳实践

1. **使用 Bun 运行时**
   - 开发时使用 `bun run` 直接执行，获得最佳性能
   - 生产环境使用 `bun build` 打包

2. **类型安全**
   - 所有命令函数都应使用 TypeScript 类型注解
   - 使用 Zod 进行运行时数据验证

3. **用户体验**
   - 提供清晰的错误信息
   - 支持彩色输出
   - 提供进度指示

4. **可扩展性**
   - 命令模块化设计
   - 支持插件机制
   - 提供钩子函数
