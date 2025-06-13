#!/usr/bin/env node

/**
 * 跨平台启动脚本 - 自动检测操作系统并设置正确的环境变量
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 启动中文电视剧转录系统...');
console.log(`📍 操作系统: ${os.platform()}`);
console.log(`🔧 环境: ${process.env.NODE_ENV}`);

// 检查是否在 Replit 环境中
const isReplit = process.env.REPLIT_CLUSTER || process.env.REPL_ID;
if (isReplit) {
  console.log('☁️  运行在 Replit 环境');
}

// 启动服务器
const serverScript = path.join(__dirname, 'server', 'index.ts');
const child = spawn('npx', ['tsx', serverScript], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

child.on('error', (error) => {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ 进程退出，退出码: ${code}`);
  }
  process.exit(code);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭服务器...');
  child.kill('SIGTERM');
});