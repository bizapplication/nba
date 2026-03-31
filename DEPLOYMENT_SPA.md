# NBA Web 应用 SPA 模式部署指南

## ✅ 改造完成

Web 项目已成功改造为 SPA（单页应用）模式，可直接部署到 nginx。

## 📦 正确的部署流程

由于 Nuxt 3 在 SPA 模式下不直接在根目录生成 index.html，我们使用部署脚本来处理。

### 部署步骤

#### 1. 执行部署脚本

```bash
# 在 apps/web 目录下运行部署脚本
cd apps/web
node deploy.cjs
```

这将：
1. 将 `.output/public` 目录的内容复制到 `dist` 目录
2. 在 `dist` 目录创建 `index.html` 文件
3. `dist` 目录将被 git 管理，`.output` 目录被忽略

#### 2. 部署到服务器

```bash
# 部署 dist 目录到服务器
scp -r apps/web/dist/* user@server:/var/www/nba/

# 或者使用 Git 部署
cd apps/web/dist
git init
git add .
git commit -m "Deploy NBA Web App (SPA)"
git push origin main
```

#### 3. 配置 nginx

```bash
# 复制 nginx 配置
scp nginx.conf user@server:/etc/nginx/sites-available/nba

# 启用站点并重启 nginx
ssh user@server
sudo ln -s /etc/nginx/sites-available/nba /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 📁 部署目录结构

部署到服务器的目录结构：
```
/var/www/nba/
├── index.html          ← SPA 入口文件
├── _nuxt/             ← Nuxt 应用资源
│   ├── 96OZjhjk.js   ← 主入口
│   ├── [其他 JS 文件]
│   ├── entry.C4z7noZx.css
│   ├── [其他 CSS 文件]
│   ├── error-404.Dh_S-qKD.css
│   ├── error-500.CZmRK7Tf.css
│   ├── builds/
│   └── u07e-x8o.js
└── favicon.ico
```

## 📦 构建产物位置

```
apps/web/.output/
├── public/          # 静态文件（部署到 nginx 的目录）
└── server/          # 服务器端代码（SPA 模式下无需运行）
```

## 🚀 部署步骤

### 1. 复制静态文件到服务器

```bash
# 方式一：直接复制
scp -r apps/web/.output/public/* user@server:/var/www/nba/

# 方式二：使用 rsync
rsync -avz apps/web/.output/public/ user@server:/var/www/nba/

# 方式三：使用 Git 部署
cd apps/web/.output/public
git init
git add .
git commit -m "Deploy NBA Web App"
git push origin main
```

### 2. 配置 nginx

#### 基础配置

```bash
# 复制 nginx 配置文件
sudo cp nginx.conf /etc/nginx/sites-available/nba

# 启用站点
sudo ln -s /etc/nginx/sites-available/nba /etc/nginx/sites-enabled/nba

# 测试配置
sudo nginx -t

# 重启 nginx
sudo systemctl restart nginx
```

#### 完整 nginx.conf

nginx.conf 文件已在项目根目录创建，主要配置：

```nginx
server {
    listen 80;
    server_name nba.example.com;
    root /var/www/nba;
    index index.html;

    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        font/truetype
        font/opentype
        application/vnd.ms-fontobject
        image/svg+xml;

    # SPA 路由：所有请求都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 禁用隐藏文件访问
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 3. 验证部署

```bash
# 检查 nginx 状态
sudo systemctl status nginx

# 查看访问日志
sudo tail -f /var/log/nginx/nba-access.log
```

## 🔧 环境变量配置

### 本地开发

创建 `.env` 文件：

```env
API_BASE_URL=http://localhost:3000
```

### 生产环境

需要设置实际的后端 API 地址：

```bash
# 方式一：环境变量
export API_BASE_URL=https://api.example.com

# 方式二：nginx 配置（推荐）
# 在 nginx.conf 中添加：
location /api/ {
    proxy_pass http://backend-server:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 🌐 访问应用

部署完成后，在浏览器中访问：
- http://your-domain.com

或配置域名后访问：
- http://nba.example.com

## 📊 SPA 模式特点

### ✅ 优点

1. **简单部署**：只需静态文件，无需 Node.js 运行时
2. **性能优异**：所有资源从 CDN/边缘节点加载
3. **成本低**：不需要 Node.js 服务器
4. **维护简单**：只需 nginx 配置

### ⚠️ 注意事项

1. **SEO 较弱**：
   - 搜索引擎只能抓取初始 HTML
   - 需要确保关键内容在首屏渲染

2. **首屏速度**：
   - 需要等待 JS 加载
   - 可以通过代码分割优化

3. **无法使用服务端功能**：
   - 不能使用服务端中间件
   - API 调用需要配置 CORS

## 🔍 常见问题

### 1. 404 错误

**问题**：刷新页面后 404

**解决**：检查 nginx 配置中的 `try_files` 指令：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 2. 静态资源 404

**问题**：JS/CSS 文件找不到

**解决**：检查 `root` 路径是否正确：
```nginx
root /var/www/nba;  # 指向 public 目录
```

### 3. API 请求失败

**问题**：前端无法连接后端 API

**解决**：
1. 检查 `runtimeConfig.public.apiBase` 配置
2. 配置 nginx 反向代理
3. 或设置 CORS 策略

## 📝 后续优化建议

### 1. 添加 meta 标签

在 `nuxt.config.ts` 中添加 SEO meta：

```ts
export default defineNuxtConfig({
  ssr: false,
  app: {
    head: {
      meta: [
        { name: 'description', content: 'NBA - 下一代业务应用' },
        { name: 'keywords', content: 'CRM, ERP, AI, 业务平台' },
        { property: 'og:title', content: 'NBA - 下一代业务应用' },
        { property: 'og:description', content: '基于 AI 的企业级业务平台' },
        { name: 'twitter:card', content: 'summary_large_image' }
      ]
    }
  }
})
```

### 2. 代码分割优化

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 优化 chunk 分割策略
          }
        }
      }
    }
  }
})
```

### 3. PWA 支持

```bash
pnpm add -D @vite-pwa/nuxt
```

## 📞 调试技巧

### 本地验证 SPA 构建

```bash
# 预览构建后的应用
pnpm preview:web

# 或直接用静态服务器
cd apps/web/.output/public
npx serve
```

### 测试 nginx 配置

```bash
# 测试配置文件语法
nginx -t -c /path/to/nginx.conf

# 模拟部署
docker run -p 80:80 -v $(pwd):/usr/share/nginx/html nginx
```

## 🎉 完成

现在您的 NBA Web 应用已准备就绪，可以部署到任何静态文件托管服务！

- ✅ nginx
- ✅ Apache
- ✅ Vercel
- ✅ Netlify
- ✅ GitHub Pages
- ✅ 任何 CDN
