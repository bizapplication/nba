#!/usr/bin/env node

/**
 * NBA Web 应用部署脚本
 * 将构建产物复制到 dist 目录，准备部署
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = path.join(__dirname, '.output', 'public');
const DIST_DIR = path.join(__dirname, 'dist');

console.log('🚀 开始部署准备工作...');

// 检查源目录是否存在
if (!fs.existsSync(SOURCE_DIR)) {
  console.error('❌ 构建目录不存在:', SOURCE_DIR);
  process.exit(1);
}

// 清空或创建目标目录
if (fs.existsSync(DIST_DIR)) {
  console.log('📁 清空目标目录:', DIST_DIR);
  try {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  } catch (err) {
    // 如果文件被锁定，使用 PowerShell 强制删除
    if (process.platform === 'win32') {
      execSync(`powershell -Command "Remove-Item -Path '${DIST_DIR}' -Recurse -Force"`, { stdio: 'inherit' });
    } else {
      throw err;
    }
  }
}

fs.mkdirSync(DIST_DIR, { recursive: true });

// 使用系统命令复制文件，更加可靠
console.log('📋 复制所有文件...');
try {
  if (process.platform === 'win32') {
    execSync(`powershell -Command "Copy-Item -Path '${SOURCE_DIR}\\*' -Destination '${DIST_DIR}' -Recurse -Force"`, { stdio: 'inherit' });
  } else {
    execSync(`cp -r ${SOURCE_DIR}/* ${DIST_DIR}/`, { stdio: 'inherit' });
  }
} catch (err) {
  console.error('❌ 复制文件失败:', err.message);
  process.exit(1);
}

console.log('✅ 部署准备完成！');
console.log('');
console.log('📦 dist 目录结构:');
console.log(DIST_DIR);
console.log('');
console.log('🚀 下一步：');
console.log('1. 将 dist 目录部署到服务器');
console.log('2. 配置 nginx 指向到 dist 目录');
console.log('');
console.log('💡 提示：源码中的 apps/web/public/index.html 也会被复制到 dist');
