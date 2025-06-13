@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 中文电视剧音频转文字系统 - Windows安装脚本
echo 针对 NVIDIA RTX 3060 Ti 优化
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 请以管理员身份运行此脚本
    echo 右键点击脚本文件，选择 "以管理员身份运行"
    pause
    exit /b 1
)

:: 创建安装目录
set INSTALL_DIR=C:\ChineseTranscriber
echo 创建安装目录: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

:: 检查 Python 安装
echo.
echo [1/8] 检查 Python 安装...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: Python 未安装或未添加到 PATH
    echo 请先安装 Python 3.10: https://www.python.org/downloads/
    pause
    exit /b 1
) else (
    echo ✓ Python 已安装
)

:: 检查 CUDA 安装
echo.
echo [2/8] 检查 CUDA 安装...
nvcc --version >nul 2>&1
if %errorLevel% neq 0 (
    echo 警告: CUDA 未安装或未添加到 PATH
    echo 请安装 CUDA Toolkit: https://developer.nvidia.com/cuda-downloads
    echo 继续安装但可能只能使用 CPU 模式...
) else (
    echo ✓ CUDA 已安装
)

:: 检查 FFmpeg 安装
echo.
echo [3/8] 检查 FFmpeg 安装...
ffmpeg -version >nul 2>&1
if %errorLevel% neq 0 (
    echo 警告: FFmpeg 未安装
    echo 请安装 FFmpeg: https://ffmpeg.org/download.html
    echo 音频处理功能可能受限...
) else (
    echo ✓ FFmpeg 已安装
)

:: 创建虚拟环境
echo.
echo [4/8] 创建 Python 虚拟环境...
python -m venv venv
if %errorLevel% neq 0 (
    echo 错误: 无法创建虚拟环境
    pause
    exit /b 1
)

:: 激活虚拟环境
call venv\Scripts\activate.bat
echo ✓ 虚拟环境已创建并激活

:: 升级 pip
echo.
echo [5/8] 升级 pip...
python -m pip install --upgrade pip

:: 安装 PyTorch (CUDA 版本)
echo.
echo [6/8] 安装 PyTorch (CUDA 版本)...
echo 这可能需要几分钟时间...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
if %errorLevel% neq 0 (
    echo 警告: CUDA 版本安装失败，尝试 CPU 版本...
    pip install torch torchvision torchaudio
)

:: 安装核心依赖
echo.
echo [7/8] 安装核心依赖...
pip install openai-whisper
pip install librosa soundfile
pip install jieba opencc-python-reimplemented
pip install numpy scipy
pip install fastapi uvicorn python-multipart
pip install pydantic

:: 创建项目文件
echo.
echo [8/8] 创建项目文件和配置...

:: 创建目录结构
mkdir models uploads outputs temp logs 2>nul

:: 创建配置文件
echo 创建配置文件...
(
echo {
echo   "system": {
echo     "gpu_memory_fraction": 0.85,
echo     "max_concurrent_jobs": 1,
echo     "temp_dir": "./temp",
echo     "log_level": "INFO"
echo   },
echo   "models": {
echo     "default": "whisper-large-v3",
echo     "cache_dir": "./models",
echo     "auto_download": true
echo   },
echo   "chinese_processing": {
echo     "variant": "simplified",
echo     "multi_pronunciation": true,
echo     "smart_punctuation": true,
echo     "segmentation_method": "jieba"
echo   },
echo   "output": {
echo     "formats": ["srt", "vtt", "txt"],
echo     "encoding": "utf-8"
echo   },
echo   "gpu_optimization": {
echo     "rtx_3060ti": {
echo       "memory_fraction": 0.85,
echo       "batch_size": 1,
echo       "fp16": true,
echo       "tensorrt": true
echo     }
echo   }
echo }
) > config.json

:: 创建启动脚本
echo 创建启动脚本...
(
echo @echo off
echo cd /d "%INSTALL_DIR%"
echo call venv\Scripts\activate.bat
echo echo.
echo echo ========================================
echo echo 中文电视剧音频转文字系统
echo echo 针对 RTX 3060 Ti 优化
echo echo ========================================
echo echo.
echo echo 系统正在启动...
echo echo 请在浏览器中访问: http://localhost:5000
echo echo.
echo python app.py
echo pause
) > start.bat

:: 创建测试脚本
(
echo import torch
echo import sys
echo print("========== 系统测试 =========="]
echo print(f"Python版本: {sys.version}"^)
echo print(f"PyTorch版本: {torch.__version__}"^)
echo print(f"CUDA可用: {torch.cuda.is_available()}"^)
echo if torch.cuda.is_available(^):
echo     print(f"GPU设备: {torch.cuda.get_device_name(0)}"^)
echo     print(f"GPU内存: {torch.cuda.get_device_properties(0^).total_memory / 1e9:.1f} GB"^)
echo     print("✓ GPU设置正确"^)
echo else:
echo     print("✗ GPU不可用，将使用CPU模式"^)
echo print("========== 测试完成 =========="]
) > test_gpu.py

echo.
echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 安装位置: %INSTALL_DIR%
echo.
echo 下一步操作:
echo 1. 运行测试: python test_gpu.py
echo 2. 启动系统: 双击 start.bat
echo 3. 在浏览器访问: http://localhost:5000
echo.
echo 如遇问题，请查看 Windows部署指南.md
echo.
pause