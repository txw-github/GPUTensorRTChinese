@echo off
chcp 65001 >nul
title RTX 3060 Ti 中文视频转录系统

echo.
echo ================================================================================
echo    RTX 3060 Ti 中文视频转录系统 - 启动中...
echo ================================================================================
echo.

:: 检查Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js，请先运行 windows_installer.bat 进行安装
    pause
    exit /b 1
)

echo [1/4] 检查系统环境...
echo ✓ Node.js 已安装

:: 检查GPU
nvidia-smi >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 未检测到NVIDIA GPU，系统将使用CPU模式运行
) else (
    echo ✓ NVIDIA GPU 已检测到
)

:: 检查依赖
if not exist node_modules (
    echo [2/4] 安装依赖包...
    call npm install --silent
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo ✓ 依赖安装完成
) else (
    echo [2/4] ✓ 依赖已安装
)

echo.
echo [3/4] 启动转录系统...
echo.
echo 前端地址: http://localhost:5173
echo 后端API: http://localhost:5000
echo.
echo 正在启动服务器...

:: 启动应用
start "中文转录系统" /min cmd /c "npm run dev"

echo.
echo [4/4] 等待服务启动...
timeout /t 5 >nul

echo.
echo 正在打开浏览器...
start http://localhost:5173

echo.
echo ================================================================================
echo    系统启动完成！
echo ================================================================================
echo.
echo 使用说明：
echo • 在浏览器中上传中文视频文件
echo • 选择适合的AI模型（推荐Whisper Large V3）
echo • 开启TensorRT加速（RTX 3060 Ti专属）
echo • 等待转录完成后下载字幕文件
echo.
echo 性能监控：
echo • GPU使用率：70-90%为正常
echo • 显存占用：建议保持在6GB以下
echo • 温度：65-75°C为最佳
echo.
echo 技术支持：
echo • 查看"完整使用教程.md"获取详细说明
echo • 遇到问题请运行"系统信息.bat"获取诊断信息
echo.
pause