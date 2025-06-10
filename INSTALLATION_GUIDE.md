# GPU加速视频字幕转录系统 - 安装指南

## 系统要求

### 硬件要求
- NVIDIA GPU (支持CUDA 11.0+)
- 显存: 至少4GB (推荐8GB+)
- 内存: 至少8GB (推荐16GB+)
- 存储: 至少20GB可用空间

### 软件要求
- Ubuntu 20.04+ / Windows 10+ / macOS 10.15+
- Python 3.8-3.11
- Node.js 18+
- CUDA Toolkit 11.8+
- cuDNN 8.6+

## 详细安装步骤

### 第一步: 系统环境准备

#### Ubuntu/Linux
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
sudo apt install -y build-essential cmake git wget curl
sudo apt install -y python3 python3-pip python3-venv
sudo apt install -y nodejs npm
sudo apt install -y ffmpeg

# 安装NVIDIA驱动 (如果未安装)
sudo apt install -y nvidia-driver-530
```

#### Windows
1. 下载并安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
2. 下载并安装 [Python 3.10](https://python.org/downloads/)
3. 下载并安装 [Node.js 18+](https://nodejs.org/)
4. 下载并安装 [Git](https://git-scm.com/download/win)
5. 下载并安装 [FFmpeg](https://ffmpeg.org/download.html)

### 第二步: CUDA和cuDNN安装

#### Ubuntu/Linux
```bash
# 下载CUDA Toolkit 11.8
wget https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda_11.8.0_520.61.05_linux.run
sudo sh cuda_11.8.0_520.61.05_linux.run

# 设置环境变量
echo 'export PATH=/usr/local/cuda-11.8/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

# 下载并安装cuDNN
wget https://developer.download.nvidia.com/compute/machine-learning/cudnn/secure/8.6.0/local_installers/11.8/cudnn-linux-x86_64-8.6.0.163_cuda11-archive.tar.xz
tar -xvf cudnn-linux-x86_64-8.6.0.163_cuda11-archive.tar.xz
sudo cp cudnn-*-archive/include/cudnn*.h /usr/local/cuda/include 
sudo cp -P cudnn-*-archive/lib/libcudnn* /usr/local/cuda/lib64 
sudo chmod a+r /usr/local/cuda/include/cudnn*.h /usr/local/cuda/lib64/libcudnn*
```

#### Windows
1. 下载并安装 [CUDA Toolkit 11.8](https://developer.nvidia.com/cuda-11-8-0-download-archive)
2. 下载并安装 [cuDNN 8.6](https://developer.nvidia.com/cudnn)
3. 将cuDNN文件复制到CUDA安装目录

### 第三步: 项目部署

```bash
# 克隆项目
git clone <your-repo-url>
cd VideoSubtitleTranscriber

# 创建Python虚拟环境
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或者 Windows:
# venv\Scripts\activate

# 安装Python依赖
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install openai-whisper
pip install tensorrt
pip install jieba
pip install pypinyin
pip install websockets
pip install fastapi
pip install uvicorn
pip install python-multipart
pip install opencv-python
pip install librosa
pip install soundfile
pip install pydub
pip install nvidia-ml-py3

# 安装Node.js依赖
npm install

# 构建前端
npm run build
```

### 第四步: TensorRT优化 (可选但推荐)

```bash
# 下载并转换Whisper模型为TensorRT格式
python -c "
import whisper
model = whisper.load_model('large-v3')
print('Whisper模型下载完成')
"

# 安装TensorRT优化工具
pip install torch2trt
pip install onnx
pip install onnxruntime-gpu

# 运行TensorRT优化脚本
python server/optimize_whisper_tensorrt.py
```

### 第五步: 配置文件设置

创建配置文件 `config.json`:
```json
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
    "use_tensorrt": true
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
```

## 启动步骤

### 方法一: 开发模式启动

```bash
# 1. 激活Python虚拟环境
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 2. 启动应用
npm run dev

# 应用将在以下地址启动:
# - 前端: http://localhost:5000
# - API: http://localhost:5000/api
# - WebSocket: ws://localhost:8001
```

### 方法二: 生产模式启动

```bash
# 1. 构建生产版本
npm run build

# 2. 启动生产服务器
npm start

# 或者使用PM2管理进程
npm install -g pm2
pm2 start ecosystem.config.js
```

### 方法三: Docker部署 (推荐)

```bash
# 构建Docker镜像
docker build -t video-transcriber .

# 运行容器
docker run -d \
  --name video-transcriber \
  --gpus all \
  -p 5000:5000 \
  -p 8001:8001 \
  -v $(pwd)/uploads:/app/uploads \
  video-transcriber
```

## 验证安装

### 1. 检查GPU状态
```bash
nvidia-smi
python -c "import torch; print(f'CUDA可用: {torch.cuda.is_available()}')"
```

### 2. 检查服务状态
```bash
curl http://localhost:5000/api/system/metrics
```

### 3. 上传测试文件
- 访问 http://localhost:5000
- 拖拽视频文件到上传区域
- 点击"开始转录"按钮
- 查看实时处理进度

## 常见问题解决

### CUDA相关问题
```bash
# 检查CUDA版本
nvcc --version
nvidia-smi

# 重新安装PyTorch CUDA版本
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 内存不足问题
```bash
# 调整GPU内存使用
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# 或在代码中设置
python -c "
import torch
torch.cuda.set_per_process_memory_fraction(0.8)
"
```

### 权限问题
```bash
# 创建必要目录
mkdir -p uploads temp logs
chmod 755 uploads temp logs

# 修复文件权限
sudo chown -R $USER:$USER .
```

## 性能优化建议

1. **GPU设置**: 使用最新显卡驱动
2. **内存管理**: 根据显存大小调整batch_size
3. **并发控制**: 设置合适的max_concurrent_jobs
4. **TensorRT**: 启用TensorRT加速可提升2-3倍性能
5. **缓存策略**: 启用模型缓存减少加载时间

## 监控和日志

### 查看系统状态
- GPU使用率: http://localhost:5000/api/system/metrics
- 任务队列: http://localhost:5000/api/jobs
- 实时日志: `tail -f logs/transcription.log`

### 性能分析
```bash
# GPU内存使用
watch -n 1 nvidia-smi

# 系统资源监控
htop

# 应用日志
tail -f logs/app.log
```

## 扩展功能

1. **多语言支持**: 修改配置文件中的language参数
2. **自定义模型**: 替换Whisper模型文件
3. **批量处理**: 使用API进行批量转录
4. **集群部署**: 配置多GPU节点负载均衡

完成以上步骤后，您的GPU加速视频字幕转录系统就可以正常运行了！