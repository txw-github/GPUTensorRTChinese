@echo off
echo 启动中文转录系统...
cd /d "%~dp0"
set NODE_ENV=development
npx tsx server/index.ts
pause