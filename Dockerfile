# GPU加速视频字幕转录系统 Docker镜像

# 使用NVIDIA CUDA基础镜像
FROM nvidia/cuda:11.8-devel-ubuntu20.04

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV NODE_VERSION=18.19.0
ENV PYTHON_VERSION=3.9

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    cmake \
    pkg-config \
    software-properties-common \
    ca-certificates \
    gnupg \
    lsb-release \
    ffmpeg \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# 安装Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装Node.js依赖
RUN npm ci --only=production

# 创建Python虚拟环境
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 升级pip
RUN pip install --upgrade pip

# 安装Python依赖
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
RUN pip install \
    openai-whisper \
    jieba \
    pypinyin \
    websockets \
    fastapi \
    uvicorn[standard] \
    python-multipart \
    opencv-python-headless \
    librosa \
    soundfile \
    pydub \
    nvidia-ml-py3

# 复制应用代码
COPY . .

# 创建必要目录
RUN mkdir -p uploads temp logs models

# 设置权限
RUN chmod +x scripts/*.sh

# 构建前端
RUN npm run build

# 预下载Whisper模型
RUN python3 -c "import whisper; whisper.load_model('large-v3')"

# 暴露端口
EXPOSE 5000 8001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/system/metrics || exit 1

# 启动命令
CMD ["npm", "start"]