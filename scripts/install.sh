#!/bin/bash

# GPU加速视频字幕转录系统 - 自动安装脚本
# 支持 Ubuntu 20.04+

set -e

echo "=== GPU加速视频字幕转录系统安装脚本 ==="
echo "开始安装..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用root用户运行此脚本"
        exit 1
    fi
}

# 检查操作系统
check_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "无法检测操作系统版本"
        exit 1
    fi
    
    . /etc/os-release
    if [[ $ID != "ubuntu" ]] || [[ ${VERSION_ID%.*} -lt 20 ]]; then
        log_error "此脚本仅支持 Ubuntu 20.04+"
        exit 1
    fi
    
    log_info "检测到操作系统: $PRETTY_NAME"
}

# 检查GPU
check_gpu() {
    if ! command -v nvidia-smi &> /dev/null; then
        log_error "未检测到NVIDIA GPU或驱动未安装"
        log_info "请先安装NVIDIA驱动: sudo apt install nvidia-driver-530"
        exit 1
    fi
    
    log_info "GPU检测成功:"
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
}

# 更新系统包
update_system() {
    log_info "更新系统包..."
    sudo apt update
    sudo apt upgrade -y
}

# 安装基础依赖
install_dependencies() {
    log_info "安装基础依赖..."
    sudo apt install -y \
        build-essential \
        cmake \
        git \
        wget \
        curl \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ffmpeg \
        python3 \
        python3-pip \
        python3-venv \
        python3-dev
}

# 安装Node.js
install_nodejs() {
    log_info "安装Node.js 18..."
    
    # 检查是否已安装
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js已安装: $NODE_VERSION"
        return
    fi
    
    # 添加NodeSource仓库
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    log_info "Node.js安装完成: $(node --version)"
    log_info "npm版本: $(npm --version)"
}

# 安装CUDA Toolkit
install_cuda() {
    log_info "检查CUDA安装..."
    
    if command -v nvcc &> /dev/null; then
        CUDA_VERSION=$(nvcc --version | grep "release" | awk '{print $6}' | cut -c2-)
        log_info "CUDA已安装: $CUDA_VERSION"
        return
    fi
    
    log_info "安装CUDA Toolkit 11.8..."
    
    # 下载CUDA安装包
    cd /tmp
    wget -q https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda_11.8.0_520.61.05_linux.run
    
    # 安装CUDA
    sudo sh cuda_11.8.0_520.61.05_linux.run --silent --toolkit
    
    # 设置环境变量
    echo 'export PATH=/usr/local/cuda-11.8/bin:$PATH' >> ~/.bashrc
    echo 'export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
    
    log_info "CUDA Toolkit安装完成"
}

# 创建Python虚拟环境
setup_python_env() {
    log_info "创建Python虚拟环境..."
    
    if [[ -d "venv" ]]; then
        log_info "虚拟环境已存在"
        return
    fi
    
    python3 -m venv venv
    source venv/bin/activate
    
    # 升级pip
    pip install --upgrade pip
    
    log_info "Python虚拟环境创建完成"
}

# 安装Python依赖
install_python_deps() {
    log_info "安装Python依赖..."
    
    source venv/bin/activate
    
    # 安装PyTorch (CUDA版本)
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
    
    # 安装Whisper和相关依赖
    pip install openai-whisper
    pip install jieba
    pip install pypinyin
    pip install websockets
    pip install fastapi
    pip install uvicorn[standard]
    pip install python-multipart
    pip install opencv-python
    pip install librosa
    pip install soundfile
    pip install pydub
    pip install nvidia-ml-py3
    
    log_info "Python依赖安装完成"
}

# 安装Node.js依赖
install_node_deps() {
    log_info "安装Node.js依赖..."
    
    if [[ ! -f package.json ]]; then
        log_error "package.json不存在，请确保在项目根目录运行"
        exit 1
    fi
    
    npm install
    
    log_info "Node.js依赖安装完成"
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    
    mkdir -p uploads
    mkdir -p temp
    mkdir -p logs
    mkdir -p models
    
    # 设置权限
    chmod 755 uploads temp logs models
    
    log_info "目录创建完成"
}

# 生成配置文件
generate_config() {
    log_info "生成配置文件..."
    
    if [[ -f config.json ]]; then
        log_info "配置文件已存在，跳过生成"
        return
    fi
    
    cat > config.json << EOF
{
  "server": {
    "host": "0.0.0.0",
    "port": 5000,
    "max_file_size": "10GB",
    "upload_path": "./uploads",
    "temp_path": "./temp"
  },
  "gpu": {
    "device": "cuda:0",
    "max_concurrent_jobs": 2,
    "memory_fraction": 0.8,
    "use_tensorrt": false
  },
  "whisper": {
    "model_size": "large-v3",
    "language": "zh",
    "task": "transcribe",
    "fp16": true,
    "compute_type": "float16"
  },
  "chinese_processing": {
    "variant": "simplified",
    "multi_pronunciation": true,
    "smart_punctuation": true,
    "segmentation_method": "jieba"
  }
}
EOF
    
    log_info "配置文件生成完成"
}

# 测试安装
test_installation() {
    log_info "测试安装..."
    
    # 测试CUDA
    source venv/bin/activate
    python3 -c "
import torch
print(f'PyTorch版本: {torch.__version__}')
print(f'CUDA可用: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'CUDA版本: {torch.version.cuda}')
    print(f'GPU数量: {torch.cuda.device_count()}')
    print(f'当前GPU: {torch.cuda.get_device_name()}')
"
    
    # 测试Whisper
    python3 -c "
import whisper
print('Whisper可用')
"
    
    # 测试Node.js
    node --version
    npm --version
    
    log_info "安装测试通过"
}

# 主安装流程
main() {
    log_info "开始安装GPU加速视频字幕转录系统..."
    
    check_root
    check_os
    check_gpu
    update_system
    install_dependencies
    install_nodejs
    install_cuda
    setup_python_env
    install_python_deps
    install_node_deps
    create_directories
    generate_config
    test_installation
    
    log_info ""
    log_info "=== 安装完成! ==="
    log_info ""
    log_info "下一步操作:"
    log_info "1. 重新加载环境变量: source ~/.bashrc"
    log_info "2. 启动服务: npm run dev"
    log_info ""
    log_info "访问地址: http://localhost:5000"
    log_info ""
}

# 运行主函数
main "$@"