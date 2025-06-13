@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo RTX 3060 Ti 中文转录系统 - 依赖安装
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 建议以管理员身份运行以避免权限问题
    echo 继续安装...
    echo.
)

:: 检查Python
echo [1/6] 检查Python安装...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: Python未安装
    echo 请下载并安装Python 3.10: https://www.python.org/downloads/
    pause
    exit /b 1
) else (
    for /f "tokens=2" %%a in ('python --version 2^>^&1') do set PYTHON_VERSION=%%a
    echo ✓ Python !PYTHON_VERSION! 已安装
)

:: 检查pip
echo.
echo [2/6] 检查pip...
pip --version >nul 2>&1
if %errorLevel% neq 0 (
    echo 安装pip...
    python -m ensurepip --upgrade
) else (
    echo ✓ pip 已安装
)

:: 升级pip
echo 升级pip到最新版本...
python -m pip install --upgrade pip

:: 检查CUDA
echo.
echo [3/6] 检查CUDA和GPU...
nvidia-smi >nul 2>&1
if %errorLevel% neq 0 (
    echo 警告: nvidia-smi 未找到
    echo 请确保已安装NVIDIA驱动程序
    set GPU_AVAILABLE=false
) else (
    echo ✓ NVIDIA驱动已安装
    nvidia-smi | findstr "RTX 3060" >nul
    if !errorLevel! equ 0 (
        echo ✓ 检测到RTX 3060系列显卡
    ) else (
        echo 检测到NVIDIA显卡（非RTX 3060）
    )
    set GPU_AVAILABLE=true
)

:: 安装PyTorch
echo.
echo [4/6] 安装PyTorch...
if "%GPU_AVAILABLE%"=="true" (
    echo 安装支持CUDA的PyTorch版本...
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    if !errorLevel! neq 0 (
        echo CUDA版本安装失败，尝试CPU版本...
        pip install torch torchvision torchaudio
    )
) else (
    echo 安装CPU版本的PyTorch...
    pip install torch torchvision torchaudio
)

:: 安装Whisper
echo.
echo [5/6] 安装Whisper...
pip install openai-whisper
if %errorLevel% neq 0 (
    echo Whisper安装失败，请检查网络连接
    pause
    exit /b 1
) else (
    echo ✓ Whisper安装成功
)

:: 安装其他依赖
echo.
echo [6/6] 安装其他依赖...
pip install librosa soundfile
pip install jieba opencc-python-reimplemented
pip install numpy scipy

:: 测试安装
echo.
echo ========================================
echo 测试安装结果...
echo ========================================

python -c "import torch; print('PyTorch版本:', torch.__version__); print('CUDA可用:', torch.cuda.is_available()); print('GPU设备:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')" 2>nul
if %errorLevel% equ 0 (
    echo ✓ PyTorch测试通过
) else (
    echo ✗ PyTorch测试失败
)

python -c "import whisper; print('Whisper可用')" 2>nul
if %errorLevel% equ 0 (
    echo ✓ Whisper测试通过
) else (
    echo ✗ Whisper测试失败
)

echo.
echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 下一步：
echo 1. 运行 start_transcriber.bat 启动系统
echo 2. 在浏览器中使用转录功能
echo.
echo 如需FFmpeg支持（视频处理）：
echo 请从 https://ffmpeg.org 下载并添加到PATH
echo.
pause