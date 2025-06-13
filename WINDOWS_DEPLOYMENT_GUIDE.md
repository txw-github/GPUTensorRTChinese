# Windows 中文电视剧音频转文字系统 - 完整部署指南

## 系统要求

### 硬件要求
- **显卡**: NVIDIA RTX 3060 Ti (6GB VRAM) 或更高
- **内存**: 16GB RAM 推荐
- **存储**: 至少 20GB 可用空间
- **CPU**: Intel i5-8400 或 AMD Ryzen 5 2600 以上

### 软件要求
- **操作系统**: Windows 10/11 (64位)
- **Python**: 3.8 - 3.11 (推荐 3.10)
- **CUDA**: 11.8 或 12.1
- **FFmpeg**: 最新版本

## 第一步：安装基础环境

### 1.1 安装 Python
1. 访问 [Python官网](https://www.python.org/downloads/windows/)
2. 下载 Python 3.10.x 版本
3. **重要**: 安装时勾选 "Add Python to PATH"
4. 验证安装：
```cmd
python --version
pip --version
```

### 1.2 安装 CUDA Toolkit
1. 访问 [NVIDIA CUDA下载页面](https://developer.nvidia.com/cuda-downloads)
2. 选择：Windows > x86_64 > 版本 > exe(local)
3. 下载并安装 CUDA Toolkit 11.8 或 12.1
4. 验证安装：
```cmd
nvcc --version
nvidia-smi
```

### 1.3 安装 FFmpeg
1. 访问 [FFmpeg官网](https://ffmpeg.org/download.html#build-windows)
2. 下载 Windows 版本
3. 解压到 `C:\ffmpeg`
4. 添加 `C:\ffmpeg\bin` 到系统环境变量 PATH
5. 验证安装：
```cmd
ffmpeg -version
```

## 第二步：创建项目环境

### 2.1 创建项目文件夹
```cmd
mkdir C:\ChineseTranscriber
cd C:\ChineseTranscriber
```

### 2.2 创建虚拟环境
```cmd
python -m venv venv
venv\Scripts\activate
```

### 2.3 升级 pip
```cmd
python -m pip install --upgrade pip
```

## 第三步：安装 PyTorch 和依赖

### 3.1 安装 PyTorch (CUDA版本)
**对于 CUDA 11.8:**
```cmd
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**对于 CUDA 12.1:**
```cmd
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 3.2 验证 PyTorch GPU 支持
创建测试文件 `test_gpu.py`：
```python
import torch
print(f"PyTorch版本: {torch.__version__}")
print(f"CUDA可用: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU设备: {torch.cuda.get_device_name(0)}")
    print(f"GPU内存: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

运行测试：
```cmd
python test_gpu.py
```

## 第四步：安装音频转录依赖

### 4.1 安装 Whisper
```cmd
pip install openai-whisper
```

### 4.2 安装音频处理库
```cmd
pip install librosa soundfile
```

### 4.3 安装中文处理库
```cmd
pip install jieba opencc-python-reimplemented
```

### 4.4 安装其他依赖
```cmd
pip install numpy scipy matplotlib
pip install fastapi uvicorn
pip install python-multipart
```

## 第五步：安装 TensorRT (可选，提升性能)

### 5.1 下载 TensorRT
1. 访问 [NVIDIA TensorRT页面](https://developer.nvidia.com/tensorrt)
2. 注册并下载 TensorRT 8.6.x for Windows
3. 解压到 `C:\TensorRT`

### 5.2 安装 TensorRT Python 包
```cmd
cd C:\TensorRT\python
pip install tensorrt-8.6.*.whl
```

### 5.3 设置环境变量
添加到系统环境变量：
- `TRT_LIBPATH`: `C:\TensorRT\lib`
- 在 PATH 中添加: `C:\TensorRT\lib`

## 第六步：下载和配置项目

### 6.1 创建项目结构
```cmd
mkdir models
mkdir uploads
mkdir outputs
mkdir temp
```

### 6.2 创建配置文件 `config.json`
```json
{
  "system": {
    "gpu_memory_fraction": 0.85,
    "max_concurrent_jobs": 1,
    "temp_dir": "./temp"
  },
  "models": {
    "default": "whisper-large-v3",
    "available": [
      {
        "name": "whisper-large-v3",
        "display_name": "Whisper Large V3 (推荐)",
        "memory_required": 4096,
        "download_url": "automatic"
      },
      {
        "name": "whisper-medium",
        "display_name": "Whisper Medium (平衡)",
        "memory_required": 2048,
        "download_url": "automatic"
      },
      {
        "name": "whisper-small",
        "display_name": "Whisper Small (快速)",
        "memory_required": 1024,
        "download_url": "automatic"
      }
    ]
  },
  "chinese_processing": {
    "variant": "simplified",
    "multi_pronunciation": true,
    "smart_punctuation": true,
    "segmentation_method": "jieba"
  },
  "output": {
    "formats": ["srt", "vtt", "txt"],
    "encoding": "utf-8"
  }
}
```

## 第七步：创建启动脚本

### 7.1 创建 `start.bat`
```batch
@echo off
cd /d C:\ChineseTranscriber
call venv\Scripts\activate
echo 正在启动中文电视剧转录系统...
echo 请在浏览器中访问: http://localhost:5000
python app.py
pause
```

### 7.2 创建 `install_models.py`
```python
"""
模型下载和安装脚本
"""
import whisper
import os
import json

def download_whisper_models():
    """下载Whisper模型"""
    models_to_download = ["small", "medium", "large-v3"]
    
    print("开始下载Whisper模型...")
    for model_name in models_to_download:
        try:
            print(f"下载 {model_name} 模型...")
            model = whisper.load_model(model_name)
            print(f"✓ {model_name} 模型下载完成")
        except Exception as e:
            print(f"✗ {model_name} 模型下载失败: {e}")

if __name__ == "__main__":
    download_whisper_models()
    print("模型下载完成！")
```

## 第八步：创建主应用程序

### 8.1 创建 `app.py`
```python
"""
中文电视剧音频转文字系统 - 主应用
"""
import os
import json
import asyncio
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 导入我们的转录器
from multi_model_transcriber import MultiModelTranscriber, TranscriptionConfig

app = FastAPI(title="中文电视剧转录系统")

# CORS设置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局转录器
transcriber = MultiModelTranscriber()

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """主页"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>中文电视剧转录系统</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .upload-area { border: 2px dashed #ccc; padding: 20px; text-align: center; }
            .button { background: #007cba; color: white; padding: 10px 20px; border: none; cursor: pointer; }
            .result { margin-top: 20px; padding: 20px; background: #f5f5f5; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎬 中文电视剧音频转文字系统</h1>
            <p>支持多种AI模型，专为NVIDIA RTX 3060 Ti优化</p>
            
            <form id="uploadForm" enctype="multipart/form-data">
                <div class="upload-area">
                    <input type="file" id="videoFile" name="file" accept="video/*,audio/*" required>
                    <p>选择视频或音频文件</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <label>选择转录模型:</label>
                    <select id="model" name="model">
                        <option value="whisper-large-v3">Whisper Large V3 (推荐)</option>
                        <option value="whisper-medium">Whisper Medium (平衡)</option>
                        <option value="whisper-small">Whisper Small (快速)</option>
                    </select>
                </div>
                
                <button type="submit" class="button">开始转录</button>
            </form>
            
            <div id="progress" style="display:none;">
                <h3>转录进度:</h3>
                <div id="progressBar"></div>
                <div id="progressText"></div>
            </div>
            
            <div id="result" class="result" style="display:none;">
                <h3>转录结果:</h3>
                <div id="resultContent"></div>
            </div>
        </div>
        
        <script>
            document.getElementById('uploadForm').onsubmit = async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                const fileInput = document.getElementById('videoFile');
                const modelSelect = document.getElementById('model');
                
                formData.append('file', fileInput.files[0]);
                formData.append('model', modelSelect.value);
                
                document.getElementById('progress').style.display = 'block';
                document.getElementById('result').style.display = 'none';
                
                try {
                    const response = await fetch('/transcribe', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        document.getElementById('result').style.display = 'block';
                        document.getElementById('resultContent').innerHTML = 
                            '<h4>转录文本:</h4>' +
                            '<pre>' + result.text + '</pre>' +
                            '<p>处理时间: ' + result.processing_time + '秒</p>' +
                            '<p>使用模型: ' + result.model + '</p>';
                    } else {
                        alert('转录失败: ' + result.error);
                    }
                } catch (error) {
                    alert('请求失败: ' + error);
                } finally {
                    document.getElementById('progress').style.display = 'none';
                }
            }
        </script>
    </body>
    </html>
    """
    return html_content

@app.get("/models")
async def get_available_models():
    """获取可用模型列表"""
    try:
        models = transcriber.get_available_models()
        gpu_info = transcriber.gpu_info
        
        return {
            "models": models,
            "gpu_info": gpu_info,
            "system_ready": gpu_info["available"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_file(
    file: UploadFile = File(...),
    model: str = Form("whisper-large-v3"),
    language: str = Form("zh")
):
    """转录文件"""
    try:
        # 保存上传的文件
        upload_path = f"uploads/{file.filename}"
        os.makedirs("uploads", exist_ok=True)
        
        with open(upload_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # 配置转录参数
        config = TranscriptionConfig(
            model_name=model,
            language=language,
            use_gpu=True,
            use_tensorrt=True
        )
        
        # 执行转录
        result = transcriber.transcribe_audio(upload_path, config)
        
        # 清理临时文件
        os.remove(upload_path)
        
        return {
            "success": True,
            "text": result.full_text,
            "segments": [
                {
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text,
                    "confidence": seg.confidence
                }
                for seg in result.segments
            ],
            "model": result.model_used,
            "processing_time": round(result.processing_time, 2),
            "gpu_used": result.gpu_used,
            "tensorrt_used": result.tensorrt_used
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    print("🎬 中文电视剧转录系统启动中...")
    print("请在浏览器中访问: http://localhost:5000")
    
    uvicorn.run(app, host="0.0.0.0", port=5000)
```

## 第九步：系统测试和验证

### 9.1 创建测试脚本 `test_system.py`
```python
"""
系统测试脚本
"""
import torch
from multi_model_transcriber import MultiModelTranscriber, GPUDetector

def test_gpu_setup():
    """测试GPU设置"""
    print("=== GPU测试 ===")
    detector = GPUDetector()
    gpu_info = detector.detect_gpu()
    
    for key, value in gpu_info.items():
        print(f"{key}: {value}")
    
    if gpu_info["available"]:
        print("✓ GPU设置正确")
        return True
    else:
        print("✗ GPU设置有问题")
        return False

def test_models():
    """测试模型可用性"""
    print("\n=== 模型测试 ===")
    transcriber = MultiModelTranscriber()
    models = transcriber.get_available_models()
    
    for model in models:
        compatibility = transcriber.check_model_compatibility(model["name"])
        status = "✓" if compatibility["compatible"] else "✗"
        print(f"{status} {model['display_name']}: {compatibility['reason']}")

def main():
    """主测试函数"""
    print("中文电视剧转录系统 - 系统测试")
    print("=" * 50)
    
    gpu_ok = test_gpu_setup()
    test_models()
    
    print("\n=== 测试总结 ===")
    if gpu_ok:
        print("✓ 系统准备就绪，可以开始使用！")
    else:
        print("✗ 请检查GPU和CUDA安装")

if __name__ == "__main__":
    main()
```

## 第十步：启动和使用

### 10.1 首次运行设置
1. 打开命令提示符（管理员权限）
2. 进入项目目录：
```cmd
cd C:\ChineseTranscriber
```

3. 激活虚拟环境：
```cmd
venv\Scripts\activate
```

4. 下载模型：
```cmd
python install_models.py
```

5. 测试系统：
```cmd
python test_system.py
```

### 10.2 启动应用
```cmd
python app.py
```

或者双击 `start.bat` 文件

### 10.3 使用系统
1. 在浏览器中访问 `http://localhost:5000`
2. 选择视频或音频文件
3. 选择转录模型
4. 点击"开始转录"
5. 等待处理完成，查看结果

## 故障排除

### GPU相关问题
1. **CUDA未检测到**:
   - 确认已安装NVIDIA驱动程序
   - 重新安装CUDA Toolkit
   - 重启计算机

2. **显存不足**:
   - 关闭其他GPU应用程序
   - 选择较小的模型（如whisper-small）
   - 调整配置中的gpu_memory_fraction

3. **模型加载失败**:
   - 检查网络连接
   - 手动下载模型：`python install_models.py`

### 音频处理问题
1. **FFmpeg错误**:
   - 确认FFmpeg已正确安装
   - 检查PATH环境变量
   - 重新下载FFmpeg

2. **文件格式不支持**:
   - 支持的格式：MP4, AVI, MKV, MP3, WAV, M4A
   - 使用FFmpeg转换格式

## 性能优化建议

### 针对RTX 3060 Ti的优化
1. **模型选择**:
   - 日常使用：whisper-medium
   - 高质量：whisper-large-v3
   - 快速处理：whisper-small

2. **系统设置**:
   - 关闭Windows游戏模式
   - 设置高性能电源计划
   - 确保充足的散热

3. **批量处理**:
   - 一次处理一个文件
   - 避免同时运行其他GPU程序

## 更新和维护

### 定期维护
1. 更新NVIDIA驱动程序
2. 更新Python包：
```cmd
pip install --upgrade torch whisper
```

3. 清理临时文件：
```cmd
rmdir /s temp
mkdir temp
```

---

## 技术支持

如果遇到问题，请提供以下信息：
1. 系统配置（GPU型号、驱动版本）
2. 错误信息截图
3. `test_system.py` 的输出结果

这个部署指南专门针对Windows系统和NVIDIA RTX 3060 Ti显卡优化，提供了完整的安装和配置步骤。按照此指南操作，即使没有编程经验的用户也能成功部署这个中文电视剧音频转文字系统。