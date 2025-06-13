# 中文电视剧音频转文字系统

专为 Windows NVIDIA RTX 3060 Ti 显卡优化的多模型中文语音识别系统。

## 系统特色

- 🎯 **专为RTX 3060 Ti优化** - 充分利用6GB显存进行GPU加速
- 🤖 **多模型支持** - Whisper Large V3、Medium、Small 和 FiredASR
- 🇨🇳 **中文优化** - 多音字识别、智能标点、简繁转换
- ⚡ **TensorRT加速** - 显著提升推理速度
- 📝 **多格式输出** - SRT、VTT、TXT字幕文件
- 🔄 **实时监控** - GPU使用率、显存、温度监控

## 快速开始

### 方法一：一键安装脚本（推荐）

1. 下载项目到本地
2. 右键以管理员身份运行 `scripts/windows_setup.bat`
3. 脚本会自动安装所有依赖和配置环境
4. 安装完成后双击 `start.bat` 启动系统

### 方法二：手动安装

#### 1. 环境准备

**必须安装的软件：**
- Python 3.10.x
- CUDA Toolkit 11.8 或 12.1
- FFmpeg
- Visual Studio Build Tools（C++编译支持）

**验证安装：**
```cmd
python --version
nvcc --version
nvidia-smi
ffmpeg -version
```

#### 2. 创建项目环境

```cmd
# 创建项目目录
mkdir C:\ChineseTranscriber
cd C:\ChineseTranscriber

# 创建虚拟环境
python -m venv venv
venv\Scripts\activate

# 升级pip
python -m pip install --upgrade pip
```

#### 3. 安装依赖

```cmd
# 安装PyTorch (CUDA 12.1版本)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# 安装Whisper和音频处理
pip install openai-whisper
pip install librosa soundfile

# 安装中文处理
pip install jieba opencc-python-reimplemented

# 安装Web框架
pip install fastapi uvicorn python-multipart

# 安装其他依赖
pip install numpy scipy pydantic
```

#### 4. 配置优化

创建 `config.json`：
```json
{
  "system": {
    "gpu_memory_fraction": 0.85,
    "max_concurrent_jobs": 1,
    "temp_dir": "./temp"
  },
  "models": {
    "default": "whisper-large-v3",
    "cache_dir": "./models"
  },
  "gpu_optimization": {
    "rtx_3060ti": {
      "memory_fraction": 0.85,
      "batch_size": 1,
      "fp16": true,
      "tensorrt": true
    }
  }
}
```

## 使用方法

### Web界面使用

1. 启动系统：
```cmd
python app.py
```

2. 在浏览器中访问：`http://localhost:5000`

3. 选择转录模型：
   - **Whisper Large V3** - 最高准确率（推荐）
   - **Whisper Medium** - 平衡速度和准确率
   - **Whisper Small** - 最快速度
   - **FiredASR AED** - 专业中文模型

4. 上传视频文件：
   - 支持格式：MP4, AVI, MKV, MOV
   - 最大10GB文件大小

5. 等待转录完成并下载字幕文件

### 命令行使用

```python
from multi_model_transcriber import MultiModelTranscriber, TranscriptionConfig

# 创建转录器
transcriber = MultiModelTranscriber()

# 配置参数
config = TranscriptionConfig(
    model_name="whisper-large-v3",
    language="zh",
    use_gpu=True,
    use_tensorrt=True
)

# 转录视频
result = transcriber.transcribe_video("video.mp4", config)
print(result.full_text)
```

## 性能优化

### RTX 3060 Ti 专用优化

1. **显存管理**：
```python
# 设置显存使用率为85%
config.gpu_memory_fraction = 0.85

# 使用混合精度
config.use_fp16 = True
```

2. **TensorRT加速**：
```python
# 启用TensorRT优化
config.use_tensorrt = True
config.tensorrt_precision = "fp16"
```

3. **批处理优化**：
```python
# RTX 3060 Ti推荐设置
config.batch_size = 1  # 避免显存溢出
config.chunk_length = 30  # 30秒音频块
```

### 模型选择建议

| 模型 | 显存需求 | 处理速度 | 准确率 | 适用场景 |
|------|----------|----------|--------|----------|
| Whisper Large V3 | 4GB | 慢 | 最高 | 高质量电视剧、电影 |
| Whisper Medium | 2GB | 中等 | 高 | 日常视频、新闻 |
| Whisper Small | 1GB | 快 | 中等 | 快速预览、短视频 |
| FiredASR AED | 3GB | 中等 | 专业 | 方言、口语化内容 |

## 故障排除

### 常见问题

**1. CUDA未检测到**
```cmd
# 检查NVIDIA驱动
nvidia-smi

# 重新安装CUDA Toolkit
# 确保版本兼容：RTX 3060 Ti支持CUDA 11.0+
```

**2. 显存不足错误**
```python
# 降低显存使用率
config.gpu_memory_fraction = 0.7

# 或选择较小模型
config.model_name = "whisper-medium"
```

**3. 音频提取失败**
```cmd
# 检查FFmpeg安装
ffmpeg -version

# 手动转换音频格式
ffmpeg -i input.mp4 -acodec pcm_s16le -ar 16000 -ac 1 output.wav
```

**4. 中文识别不准确**
```python
# 启用中文优化
config.chinese_settings = {
    "variant": "simplified",
    "multi_pronunciation": True,
    "smart_punctuation": True,
    "segmentation_method": "jieba"
}
```

### 性能监控

系统提供实时监控：
- GPU使用率
- 显存占用
- 温度监控
- 处理进度

访问 `http://localhost:5000/api/system/metrics` 获取详细数据。

## 高级功能

### 批量处理

```python
# 批量处理多个视频
video_files = ["video1.mp4", "video2.mp4", "video3.mp4"]
results = transcriber.batch_transcribe(video_files, max_workers=1)
```

### 自定义后处理

```python
# 自定义中文处理
from chinese_processor import ChineseProcessor

processor = ChineseProcessor({
    "variant": "traditional",  # 输出繁体中文
    "smart_punctuation": True,
    "segmentation_method": "ai"
})

processed_text = processor.process_text(raw_text)
```

### API集成

系统提供RESTful API：

```bash
# 上传文件转录
curl -X POST "http://localhost:5000/api/transcribe" \
  -F "file=@video.mp4" \
  -F "model=whisper-large-v3" \
  -F "language=zh"

# 查询进度
curl "http://localhost:5000/api/jobs/1"

# 获取系统状态
curl "http://localhost:5000/api/system/metrics"
```

## 更新和维护

### 模型更新

```cmd
# 更新Whisper模型
pip install --upgrade openai-whisper

# 清理模型缓存
rmdir /s models
```

### 系统优化

```cmd
# 更新GPU驱动
# 访问NVIDIA官网下载最新驱动

# 清理临时文件
rmdir /s temp
mkdir temp

# 重建虚拟环境（如遇严重问题）
rmdir /s venv
python -m venv venv
```

## 技术支持

如果遇到问题，请提供：
1. 系统配置（GPU型号、驱动版本）
2. 错误信息截图
3. 测试文件信息
4. 运行日志

这个系统专门为您的RTX 3060 Ti显卡优化，能够高效处理中文电视剧的音频转文字任务。按照此指南操作，您将获得专业级的转录效果。