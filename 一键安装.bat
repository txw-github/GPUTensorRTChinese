@echo off
chcp 65001 >nul
title 中文视频转录系统 - 一键安装部署

echo.
echo ===================================================
echo          中文视频转录系统 RTX 3060 Ti 专业版
echo          一键安装部署脚本 v1.0
echo ===================================================
echo.

echo [步骤 1/6] 检查系统环境...
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 管理员权限: 已获取
) else (
    echo ❌ 请以管理员身份运行此脚本
    echo    右键点击脚本 → "以管理员身份运行"
    pause
    exit /b 1
)

:: 检查Windows版本
ver | findstr /i "10\." >nul
if %errorLevel% == 0 (
    echo ✅ Windows版本: Windows 10 ✓
    goto :checknode
)

ver | findstr /i "11\." >nul
if %errorLevel% == 0 (
    echo ✅ Windows版本: Windows 11 ✓
    goto :checknode
) else (
    echo ❌ 不支持的Windows版本，需要Windows 10或11
    pause
    exit /b 1
)

:checknode
echo.
echo [步骤 2/6] 检查Node.js环境...
node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js: %NODE_VERSION% 已安装
) else (
    echo ❌ Node.js未安装
    echo.
    echo 正在打开Node.js下载页面...
    start https://nodejs.org/
    echo.
    echo 请按照以下步骤操作:
    echo 1. 下载 "LTS" 版本 ^(推荐 20.x.x^)
    echo 2. 运行安装程序，保持默认设置
    echo 3. 安装完成后重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo.
echo [步骤 3/6] 检查NVIDIA GPU...
nvidia-smi >nul 2>&1
if %errorLevel__ == 0 (
    echo ✅ NVIDIA GPU: 驱动已安装
    nvidia-smi --query-gpu=name --format=csv,noheader,nounits | findstr /i "3060" >nul
    if %errorLevel% == 0 (
        echo ✅ 检测到RTX 3060系列显卡
    ) else (
        echo ⚠️  未检测到RTX 3060，但可以继续安装
    )
) else (
    echo ❌ NVIDIA驱动未安装或GPU未检测到
    echo.
    echo 正在打开NVIDIA驱动下载页面...
    start https://www.nvidia.com/drivers/
    echo.
    echo 请按照以下步骤操作:
    echo 1. 选择您的显卡型号 ^(RTX 3060 Ti^)
    echo 2. 下载并安装最新驱动
    echo 3. 重启计算机
    echo 4. 重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo.
echo [步骤 4/6] 安装项目依赖...
if not exist "package.json" (
    echo ❌ 错误: 未找到package.json文件
    echo    请确保在正确的项目目录中运行此脚本
    pause
    exit /b 1
)

echo 📦 正在安装依赖包...
npm install --silent
if %errorLevel% == 0 (
    echo ✅ 依赖安装完成
) else (
    echo ❌ 依赖安装失败，尝试清理缓存重新安装...
    npm cache clean --force
    if exist "node_modules" rmdir /s /q "node_modules"
    npm install
    if %errorLevel__ == 0 (
        echo ✅ 依赖安装完成
    ) else (
        echo ❌ 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
)

echo.
echo [步骤 5/6] 配置系统设置...
echo 🔧 创建快捷启动脚本...

:: 创建桌面快捷方式启动脚本
echo @echo off > "%USERPROFILE%\Desktop\启动转录系统.bat"
echo cd /d "%CD%" >> "%USERPROFILE%\Desktop\启动转录系统.bat"
echo start start-windows.bat >> "%USERPROFILE%\Desktop\启动转录系统.bat"
echo ✅ 桌面快捷方式已创建

:: 设置防火墙例外
echo 🔧 配置防火墙规则...
netsh advfirewall firewall add rule name="中文转录系统" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
echo ✅ 防火墙规则已添加

echo.
echo [步骤 6/6] 启动系统测试...
echo 🚀 正在启动系统进行测试...

:: 设置环境变量并启动
set NODE_ENV=development
start /min cmd /c "npx tsx server/index.ts"

:: 等待服务器启动
echo 等待服务器启动...
timeout /t 10 /nobreak >nul

:: 检查服务器是否运行
netstat -an | findstr ":5000" >nul
if %errorLevel% == 0 (
    echo ✅ 服务器启动成功
    echo.
    echo ===================================================
    echo                 🎉 安装完成! 🎉
    echo ===================================================
    echo.
    echo 🌐 系统地址: http://localhost:5000
    echo 🖥️  桌面快捷方式: "启动转录系统.bat"
    echo 📁 项目目录: %CD%
    echo.
    echo 💡 使用说明:
    echo    1. 双击桌面快捷方式启动系统
    echo    2. 浏览器访问 http://localhost:5000
    echo    3. 拖拽视频文件开始转录
    echo    4. 选择AI模型和优化选项
    echo.
    echo 🔧 推荐设置 ^(RTX 3060 Ti^):
    echo    - 模型: Whisper Medium ^(平衡^)
    echo    - TensorRT加速: 开启
    echo    - RTX优化: 开启
    echo.
    echo 正在打开系统页面...
    timeout /t 3 /nobreak >nul
    start http://localhost:5000
) else (
    echo ❌ 服务器启动失败
    echo 请手动运行: start-windows.bat
)

echo.
echo 按任意键退出安装程序...
pause >nul