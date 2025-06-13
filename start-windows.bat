@echo off
chcp 65001 >nul
echo.
echo ===============================================
echo   中文电视剧音频转文字系统
echo   Windows 本地启动脚本
echo ===============================================
echo.

echo [1/4] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到Node.js，请先安装Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 环境正常

echo.
echo [2/4] 检查项目依赖...
if not exist "node_modules" (
    echo 📦 正在安装依赖包...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 依赖已安装
)

echo.
echo [3/4] 设置环境变量...
set NODE_ENV=development
set PORT=5000
echo ✅ 环境变量设置完成

echo.
echo [4/4] 启动服务器...
echo 🚀 正在启动服务器，请稍候...
echo 📱 启动后请访问: http://localhost:5000
echo 🛑 按 Ctrl+C 停止服务器
echo.

npx tsx server/index.ts

if errorlevel 1 (
    echo.
    echo ❌ 服务器启动失败
    echo 💡 请检查:
    echo    1. 端口5000是否被占用
    echo    2. 是否有足够的系统权限
    echo    3. 项目文件是否完整
    echo.
    pause
    exit /b 1
)

pause