@echo off
chcp 65001 >nul
title 系统环境检查

echo.
echo ============================================
echo       中文转录系统环境检查工具
echo ============================================
echo.

echo [1] 检查Node.js...
node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
    npm --version >nul 2>&1
    if %errorLevel% == 0 (
        for /f "tokens=*" %%i in ('npm --version') do echo ✅ NPM: %%i
    )
) else (
    echo ❌ Node.js 未安装
)

echo.
echo [2] 检查NVIDIA GPU...
nvidia-smi >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ NVIDIA 驱动已安装
    for /f "skip=1 tokens=2 delims=," %%i in ('nvidia-smi --query-gpu=name --format=csv') do (
        echo ✅ GPU: %%i
        goto :memory
    )
    :memory
    for /f "skip=1 tokens=2 delims=," %%i in ('nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits') do (
        echo ✅ 显存: %%i MB
        goto :cuda
    )
    :cuda
    for /f "skip=1 tokens=2 delims=," %%i in ('nvidia-smi --query-gpu=driver_version --format=csv') do (
        echo ✅ 驱动版本: %%i
        goto :checkdeps
    )
) else (
    echo ❌ NVIDIA GPU 未检测到
)

:checkdeps
echo.
echo [3] 检查项目文件...
if exist "package.json" (
    echo ✅ package.json 存在
) else (
    echo ❌ package.json 不存在
)

if exist "server\index.ts" (
    echo ✅ 服务器文件存在
) else (
    echo ❌ 服务器文件不存在
)

if exist "node_modules" (
    echo ✅ 依赖已安装
) else (
    echo ❌ 需要安装依赖
)

echo.
echo [4] 检查端口占用...
netstat -an | findstr ":5000" >nul
if %errorLevel% == 0 (
    echo ⚠️  端口5000已被占用
) else (
    echo ✅ 端口5000可用
)

echo.
echo [5] 内存检查...
for /f "skip=1 tokens=2" %%i in ('wmic computersystem get TotalPhysicalMemory /format:value') do (
    if "%%i" neq "" (
        set /a MEMORY_GB=%%i/1024/1024/1024
        echo ✅ 系统内存: !MEMORY_GB! GB
    )
)

echo.
echo ============================================
echo 检查完成
pause