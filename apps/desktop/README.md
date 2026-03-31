# @nba/desktop

NBA 桌面应用 - 基于 Tauri 的跨平台桌面客户端

## 技术栈

- **Tauri** - 现代化跨平台桌面应用框架
- **Vue 3** - UI 渲染框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **@nba/ui** - 共享 Vue UI 组件库

## 功能特性

- 🖥️ 跨平台支持（Windows/macOS/Linux）
- 🌐 离线工作能力
- 📱 系统托盘集成
- 🔄 自动更新机制
- 🔐 本地数据加密存储
- 🔔 桌面通知
- ⚡️ 更小的安装包（相比 Electron）

## 目录结构

```
desktop/
├── src-tauri/            # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs       # Rust 主入口
│   │   └── lib.rs        # Rust 库
│   ├── Cargo.toml        # Rust 配置
│   ├── tauri.conf.json   # Tauri 配置
│   └── icons/            # 应用图标
├── src/                  # Vue 前端
│   ├── main.ts           # Vue 入口
│   ├── App.vue           # 根组件
│   ├── components/       # 组件
│   └── views/            # 页面视图
├── public/               # 静态资源
├── index.html            # HTML 模板
├── package.json
└── vite.config.ts        # Vite 配置
```

## 安装

### 环境要求

- **Rust** >= 1.70.0
- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0

### 安装依赖

```bash
pnpm install
```

### 安装 Rust（如果未安装）

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# 下载并运行 rustup-init.exe
# https://rustup.rs/
```

## 开发

```bash
# 启动开发模式（同时运行前端和后端）
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

## 构建

```bash
# 开发构建
pnpm dev

# 生产构建
pnpm build
```

构建产物位于 `src-tauri/target/release/` 目录。

### 打包

```bash
# 打包应用（生成安装包）
pnpm build

# 或直接使用 Tauri CLI
cd src-tauri
cargo tauri build
```

打包产物：
- Windows: `src-tauri/target/release/bundle/nsis/`
- macOS: `src-tauri/target/release/bundle/dmg/`
- Linux: `src-tauri/target/release/bundle/appimage/`

## 配置

### Tauri 配置 (`src-tauri/tauri.conf.json`)

```json
{
  "productName": "NBA Desktop",
  "version": "0.0.1",
  "build": {
    "distDir": "../dist",
    "devPath": "http://localhost:5173"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "notification": {
        "all": true
      }
    }
  }
}
```

### Vite 配置 (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
```

## 开发指南

### 前端开发（Vue）

前端代码位于 `src/` 目录，使用 Vue 3 开发：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api'

const message = ref('')

async function greet() {
  message.value = await invoke('greet', { name: 'World' })
}
</script>

<template>
  <div>
    <button @click="greet">Greet</button>
    <p>{{ message }}</p>
  </div>
</template>
```

### 后端开发（Rust）

后端代码位于 `src-tauri/src/` 目录，使用 Rust 开发：

```rust
use tauri::command;

#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 组件库使用

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

## API 调用

### 从前端调用 Rust 函数

```typescript
import { invoke } from '@tauri-apps/api'

// 调用 Rust 函数
const result = await invoke('function_name', {
  param1: 'value1',
  param2: 42
})

// 使用 Tauri API
import { dialog } from '@tauri-apps/api'
await dialog.save({ defaultPath: 'file.txt' })
```

### Rust 端定义命令

```rust
#[tauri::command]
fn my_command(name: String, value: i32) -> Result<String, String> {
    // 处理逻辑
    Ok(format!("Received: {} and {}", name, value))
}

// 注册命令
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        my_command
    ])
```

## 性能优化

Tauri 相比 Electron 的优势：

- ✅ 更小的安装包（~10MB vs ~100MB+）
- ✅ 更低的内存占用
- ✅ 更快的启动速度
- ✅ 原生性能

## 权限配置

在 `tauri.conf.json` 中配置所需权限：

```json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true
      },
      "shell": {
        "all": false,
        "open": true
      },
      "notification": {
        "all": true
      }
    }
  }
}
```

## 平台支持

- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (AppImage, deb)

## 调试

### 前端调试
使用 Chrome DevTools（在开发模式自动打开）

### 后端调试
```bash
# 使用 Rust 调试器
cd src-tauri
rust-gdb target/debug/nba

# 或使用 VSCode 的 Rust 插件
```

### 查看日志

```bash
# 查看应用日志
# Windows: %APPDATA%\nba-desktop\logs\
# macOS: ~/Library/Logs/nba-desktop/
# Linux: ~/.config/nba-desktop/logs/
```

## 开发团队习惯

### 本地开发
```bash
# 使用 pnpm 脚本（推荐）
pnpm dev

# 这会同时启动：
# - Vite 开发服务器（前端）
# - Tauri 应用（后端）
```

### 构建流程
```bash
# 1. 类型检查
pnpm typecheck

# 2. 代码检查
pnpm lint

# 3. 构建应用
pnpm build

# 4. 测试构建产物
./src-tauri/target/release/nba
```

### 依赖管理
```bash
# 前端依赖（通过 pnpm）
pnpm add package-name

# 后端依赖（通过 Cargo）
cd src-tauri
cargo add package-name
```

## 常见问题

### Rust 编译错误
```bash
# 清理构建缓存
cd src-tauri
cargo clean
cargo build
```

### Vite HMR 不工作
```bash
# 重启开发服务器
pnpm dev
```

### 权限错误
检查 `tauri.conf.json` 中的 `allowlist` 配置。

## 参考资源

- [Tauri 官方文档](https://tauri.app/)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
