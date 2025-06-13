@echo off
chcp 65001 >nul
echo ========================================
echo 中文电视剧音频转文字系统
echo 专为 RTX 3060 Ti 优化
echo ========================================
echo.

:: 检查Python
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: Python未安装，请先安装Python 3.10+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 启动系统
echo 正在启动转录系统...
echo 浏览器将自动打开 http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

python windows_transcriber.py

pause