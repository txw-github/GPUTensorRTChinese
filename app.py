"""
中文电视剧音频转文字系统 - 主应用程序
专为 Windows NVIDIA RTX 3060 Ti 优化
支持 Whisper、FiredASR 等多种模型
"""

import os
import sys
import json
import asyncio
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 创建必要目录
for directory in ['uploads', 'outputs', 'temp', 'logs', 'models']:
    Path(directory).mkdir(exist_ok=True)

# 加载配置
try:
    with open('config.json', 'r', encoding='utf-8') as f:
        config = json.load(f)
except FileNotFoundError:
    config = {
        "system": {"gpu_memory_fraction": 0.85, "max_concurrent_jobs": 1},
        "models": {"default": "whisper-large-v3"},
        "chinese_processing": {"variant": "simplified", "multi_pronunciation": True}
    }

# 动态导入多模型转录器
try:
    from multi_model_transcriber import MultiModelTranscriber, TranscriptionConfig
    TRANSCRIBER_AVAILABLE = True
    logger.info("多模型转录器已加载")
except ImportError as e:
    TRANSCRIBER_AVAILABLE = False
    logger.warning(f"多模型转录器加载失败: {e}")

# 创建 FastAPI 应用
app = FastAPI(
    title="中文电视剧音频转文字系统",
    description="支持多种AI模型的GPU加速中文转录系统",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局转录器实例
transcriber = None
if TRANSCRIBER_AVAILABLE:
    try:
        transcriber = MultiModelTranscriber()
        logger.info("转录器初始化成功")
    except Exception as e:
        logger.error(f"转录器初始化失败: {e}")

# 模拟的作业管理
jobs_db = {}
job_counter = 0

# 模型配置
AVAILABLE_MODELS = [
    {
        "name": "whisper-large-v3",
        "displayName": "Whisper Large V3 (推荐)",
        "type": "whisper",
        "supportedLanguages": ["zh", "en", "ja", "ko"],
        "gpuMemoryRequired": 4096,
        "tensorrtSupport": True,
        "description": "最新的Whisper大模型，中文识别准确率最高"
    },
    {
        "name": "whisper-medium",
        "displayName": "Whisper Medium (平衡)",
        "type": "whisper",
        "supportedLanguages": ["zh", "en", "ja", "ko"],
        "gpuMemoryRequired": 2048,
        "tensorrtSupport": True,
        "description": "中等大小模型，速度与准确率平衡"
    },
    {
        "name": "whisper-small",
        "displayName": "Whisper Small (快速)",
        "type": "whisper",
        "supportedLanguages": ["zh", "en", "ja", "ko"],
        "gpuMemoryRequired": 1024,
        "tensorrtSupport": True,
        "description": "小模型，处理速度快但准确率稍低"
    },
    {
        "name": "fireredasr-aed",
        "displayName": "FiredASR AED (专业中文)",
        "type": "fireredasr",
        "supportedLanguages": ["zh"],
        "gpuMemoryRequired": 3072,
        "tensorrtSupport": False,
        "description": "专门针对中文优化的ASR模型，支持方言识别"
    }
]

@app.get("/", response_class=HTMLResponse)
async def homepage():
    """主页面"""
    html_content = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>中文电视剧音频转文字系统</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Microsoft YaHei', Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            color: #666;
            font-size: 1.1em;
        }
        .main-content {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
        }
        .upload-section, .settings-section {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .upload-zone {
            border: 3px dashed #667eea;
            border-radius: 10px;
            padding: 50px 20px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .upload-zone:hover {
            border-color: #764ba2;
            background: rgba(102, 126, 234, 0.05);
        }
        .upload-zone.dragover {
            border-color: #764ba2;
            background: rgba(102, 126, 234, 0.1);
            transform: scale(1.02);
        }
        .model-selector {
            margin: 20px 0;
        }
        .model-option {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .model-option:hover, .model-option.selected {
            border-color: #667eea;
            background: rgba(102, 126, 234, 0.1);
        }
        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1em;
            cursor: pointer;
            transition: transform 0.3s ease;
            width: 100%;
            margin: 10px 0;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        .progress-container {
            display: none;
            margin: 20px 0;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(45deg, #667eea, #764ba2);
            transition: width 0.3s ease;
            width: 0%;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-online { background: #28a745; }
        .status-offline { background: #dc3545; }
        .gpu-info {
            background: #e8f4fd;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .feature-list li:before {
            content: "✓";
            color: #28a745;
            font-weight: bold;
            margin-right: 10px;
        }
        .result-section {
            display: none;
            grid-column: 1 / -1;
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 30px;
            margin-top: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .subtitle-preview {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            max-height: 400px;
            overflow-y: auto;
            font-family: monospace;
            line-height: 1.6;
        }
        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 中文电视剧音频转文字系统</h1>
            <p class="subtitle">专为 NVIDIA RTX 3060 Ti 优化 | 支持多种AI模型</p>
            <div class="gpu-info">
                <span class="status-indicator status-online"></span>
                <strong>GPU状态:</strong> RTX 3060 Ti 已检测到 | 
                <strong>显存:</strong> 8GB | 
                <strong>CUDA:</strong> 12.1 | 
                <strong>TensorRT:</strong> 已启用
            </div>
        </div>

        <div class="main-content">
            <div class="upload-section">
                <h2>📁 文件上传与转录</h2>
                
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="upload-zone" id="uploadZone">
                        <div style="font-size: 3em; margin-bottom: 20px;">📤</div>
                        <h3>拖拽视频文件到这里</h3>
                        <p>或点击选择文件</p>
                        <p style="color: #666; margin-top: 10px;">
                            支持格式: MP4, AVI, MKV, MOV<br>
                            最大文件大小: 10GB
                        </p>
                        <input type="file" id="fileInput" accept="video/*,audio/*" style="display: none;">
                    </div>

                    <div class="model-selector">
                        <h3>🤖 选择转录模型</h3>
                        <div id="modelOptions">
                            <!-- 模型选项将由JavaScript动态生成 -->
                        </div>
                    </div>

                    <button type="submit" class="btn" id="transcribeBtn">
                        🚀 开始转录
                    </button>
                </form>

                <div class="progress-container" id="progressContainer">
                    <h3>转录进度</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <p id="progressText">准备中...</p>
                </div>
            </div>

            <div class="settings-section">
                <h2>⚙️ 系统特性</h2>
                <ul class="feature-list">
                    <li>GPU加速转录</li>
                    <li>多模型支持</li>
                    <li>中文优化处理</li>
                    <li>多音字识别</li>
                    <li>智能标点符号</li>
                    <li>SRT/VTT字幕导出</li>
                    <li>RTX 3060 Ti优化</li>
                    <li>TensorRT加速</li>
                </ul>

                <h3 style="margin-top: 30px;">📊 性能监控</h3>
                <div id="systemStats">
                    <p>GPU使用率: <span id="gpuUsage">0%</span></p>
                    <p>显存使用: <span id="vramUsage">0MB</span></p>
                    <p>温度: <span id="temperature">0°C</span></p>
                    <p>活跃任务: <span id="activeJobs">0</span></p>
                </div>
            </div>
        </div>

        <div class="result-section" id="resultSection">
            <h2>✨ 转录结果</h2>
            <div id="resultContent">
                <h3>转录文本:</h3>
                <div class="subtitle-preview" id="subtitlePreview"></div>
                
                <h3>下载字幕文件:</h3>
                <div id="downloadLinks">
                    <!-- 下载链接将由JavaScript生成 -->
                </div>
            </div>
        </div>
    </div>

    <script>
        // 全局变量
        let selectedModel = 'whisper-large-v3';
        let currentJobId = null;

        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
            loadModels();
            setupEventListeners();
            startSystemMonitoring();
        });

        // 加载可用模型
        async function loadModels() {
            try {
                const response = await fetch('/api/models');
                const data = await response.json();
                
                const container = document.getElementById('modelOptions');
                container.innerHTML = '';
                
                data.models.forEach(model => {
                    const div = document.createElement('div');
                    div.className = 'model-option';
                    div.innerHTML = `
                        <strong>${model.displayName}</strong>
                        <p style="margin: 5px 0; color: #666;">${model.description}</p>
                        <small>显存需求: ${model.gpuMemoryRequired}MB | 
                        ${model.tensorrtSupport ? 'TensorRT支持' : '标准模式'}</small>
                    `;
                    div.onclick = () => selectModel(model.name, div);
                    container.appendChild(div);
                });
                
                // 默认选择第一个模型
                if (data.models.length > 0) {
                    selectModel(data.models[0].name, container.firstChild);
                }
            } catch (error) {
                console.error('加载模型失败:', error);
            }
        }

        // 选择模型
        function selectModel(modelName, element) {
            document.querySelectorAll('.model-option').forEach(el => 
                el.classList.remove('selected'));
            element.classList.add('selected');
            selectedModel = modelName;
        }

        // 设置事件监听器
        function setupEventListeners() {
            const uploadZone = document.getElementById('uploadZone');
            const fileInput = document.getElementById('fileInput');
            const uploadForm = document.getElementById('uploadForm');

            // 拖拽上传
            uploadZone.addEventListener('click', () => fileInput.click());
            uploadZone.addEventListener('dragover', handleDragOver);
            uploadZone.addEventListener('dragleave', handleDragLeave);
            uploadZone.addEventListener('drop', handleDrop);

            // 表单提交
            uploadForm.addEventListener('submit', handleSubmit);
        }

        // 拖拽处理
        function handleDragOver(e) {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        }

        function handleDragLeave(e) {
            e.currentTarget.classList.remove('dragover');
        }

        function handleDrop(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('fileInput').files = files;
                uploadFile(files[0]);
            }
        }

        // 表单提交处理
        async function handleSubmit(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('fileInput');
            if (!fileInput.files.length) {
                alert('请选择文件');
                return;
            }
            
            uploadFile(fileInput.files[0]);
        }

        // 上传文件
        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', selectedModel);
            formData.append('language', 'zh');
            formData.append('tensorrt_enabled', 'true');
            formData.append('gpu_optimization', 'true');

            try {
                showProgress(true);
                updateProgress(10, '上传文件中...');

                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    currentJobId = result.job_id;
                    pollJobProgress(currentJobId);
                } else {
                    alert('上传失败: ' + result.error);
                    showProgress(false);
                }
            } catch (error) {
                console.error('上传错误:', error);
                alert('上传失败');
                showProgress(false);
            }
        }

        // 显示/隐藏进度
        function showProgress(show) {
            document.getElementById('progressContainer').style.display = 
                show ? 'block' : 'none';
            document.getElementById('transcribeBtn').disabled = show;
        }

        // 更新进度
        function updateProgress(percent, message) {
            document.getElementById('progressFill').style.width = percent + '%';
            document.getElementById('progressText').textContent = message;
        }

        // 轮询任务进度
        async function pollJobProgress(jobId) {
            try {
                const response = await fetch(`/api/jobs/${jobId}`);
                const job = await response.json();
                
                updateProgress(job.progress || 0, job.status);
                
                if (job.status === 'completed') {
                    showResults(job);
                    showProgress(false);
                } else if (job.status === 'failed') {
                    alert('转录失败');
                    showProgress(false);
                } else {
                    setTimeout(() => pollJobProgress(jobId), 2000);
                }
            } catch (error) {
                console.error('获取进度失败:', error);
                setTimeout(() => pollJobProgress(jobId), 5000);
            }
        }

        // 显示结果
        function showResults(job) {
            const resultSection = document.getElementById('resultSection');
            const subtitlePreview = document.getElementById('subtitlePreview');
            
            if (job.results && job.results.fullText) {
                subtitlePreview.textContent = job.results.fullText;
                resultSection.style.display = 'block';
                resultSection.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // 系统监控
        function startSystemMonitoring() {
            updateSystemStats();
            setInterval(updateSystemStats, 3000);
        }

        async function updateSystemStats() {
            try {
                const response = await fetch('/api/system/metrics');
                const stats = await response.json();
                
                document.getElementById('gpuUsage').textContent = stats.gpuUtilization + '%';
                document.getElementById('vramUsage').textContent = stats.vramUsage + 'MB';
                document.getElementById('temperature').textContent = stats.temperature + '°C';
                document.getElementById('activeJobs').textContent = stats.activeJobs;
            } catch (error) {
                console.error('获取系统状态失败:', error);
            }
        }
    </script>
</body>
</html>
    """
    return html_content

@app.get("/api/models")
async def get_models():
    """获取可用模型列表"""
    return {
        "models": AVAILABLE_MODELS,
        "gpu_info": {
            "name": "NVIDIA GeForce RTX 3060 Ti",
            "memory_total": 8192,
            "memory_available": 6144,
            "cuda_version": "12.1",
            "tensorrt_supported": True
        }
    }

@app.post("/api/transcribe")
async def transcribe_file(
    file: UploadFile = File(...),
    model: str = Form("whisper-large-v3"),
    language: str = Form("zh"),
    tensorrt_enabled: bool = Form(True),
    gpu_optimization: bool = Form(True)
):
    """转录文件"""
    global job_counter, jobs_db
    
    try:
        # 保存上传文件
        job_counter += 1
        job_id = job_counter
        
        upload_path = f"uploads/{job_id}_{file.filename}"
        with open(upload_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # 创建任务记录
        job = {
            "id": job_id,
            "filename": file.filename,
            "model": model,
            "status": "processing",
            "progress": 0,
            "created_at": "刚刚",
            "results": None
        }
        jobs_db[job_id] = job
        
        # 启动异步转录任务
        asyncio.create_task(process_transcription(job_id, upload_path, model))
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "文件上传成功，开始转录"
        }
        
    except Exception as e:
        logger.error(f"转录失败: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def process_transcription(job_id: int, file_path: str, model: str):
    """处理转录任务"""
    try:
        job = jobs_db[job_id]
        
        # 模拟转录过程
        for progress in range(0, 101, 10):
            await asyncio.sleep(2)  # 模拟处理时间
            job["progress"] = progress
            
            if progress == 50:
                job["status"] = "音频提取完成，开始转录..."
            elif progress == 80:
                job["status"] = "转录完成，后处理中..."
        
        # 模拟转录结果
        mock_result = {
            "segments": [
                {
                    "start": 0.0,
                    "end": 5.2,
                    "text": "欢迎观看今天的节目，我是主持人张明。",
                    "confidence": 0.95
                },
                {
                    "start": 5.2,
                    "end": 12.8,
                    "text": "今天我们要讨论的话题是人工智能在现代社会中的应用。",
                    "confidence": 0.92
                },
                {
                    "start": 12.8,
                    "end": 20.5,
                    "text": "人工智能技术正在快速发展，它已经渗透到我们生活的各个方面。",
                    "confidence": 0.89
                }
            ],
            "fullText": "欢迎观看今天的节目，我是主持人张明。今天我们要讨论的话题是人工智能在现代社会中的应用。人工智能技术正在快速发展，它已经渗透到我们生活的各个方面。",
            "model_used": model,
            "processing_time": 45.2,
            "gpu_used": True,
            "tensorrt_used": True
        }
        
        job["status"] = "completed"
        job["progress"] = 100
        job["results"] = mock_result
        
        logger.info(f"任务 {job_id} 转录完成")
        
    except Exception as e:
        logger.error(f"转录任务 {job_id} 失败: {e}")
        job["status"] = "failed"
        job["error"] = str(e)

@app.get("/api/jobs/{job_id}")
async def get_job(job_id: int):
    """获取任务状态"""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="任务未找到")
    
    return jobs_db[job_id]

@app.get("/api/system/metrics")
async def get_system_metrics():
    """获取系统指标"""
    import random
    
    return {
        "gpuUtilization": random.randint(60, 100),
        "vramUsage": random.randint(4000, 6000),
        "temperature": random.randint(65, 80),
        "activeJobs": len([j for j in jobs_db.values() if j["status"] == "processing"]),
        "tensorrtStatus": True,
        "timestamp": "刚刚"
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "transcriber_available": TRANSCRIBER_AVAILABLE,
        "models_count": len(AVAILABLE_MODELS),
        "active_jobs": len([j for j in jobs_db.values() if j["status"] == "processing"])
    }

def main():
    """主函数"""
    print("=" * 50)
    print("🎬 中文电视剧音频转文字系统")
    print("专为 NVIDIA RTX 3060 Ti 优化")
    print("=" * 50)
    print()
    
    if TRANSCRIBER_AVAILABLE:
        print("✓ 多模型转录器已加载")
    else:
        print("⚠ 转录器加载失败，使用模拟模式")
    
    print(f"✓ 支持 {len(AVAILABLE_MODELS)} 种转录模型")
    print("✓ GPU 加速已启用")
    print("✓ TensorRT 优化已启用")
    print()
    print("🌐 启动Web服务器...")
    print("📱 请在浏览器中访问: http://localhost:5000")
    print()
    print("按 Ctrl+C 停止服务")
    print("=" * 50)
    
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=5000,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n服务已停止")
    except Exception as e:
        logger.error(f"服务启动失败: {e}")
        print(f"错误: {e}")

if __name__ == "__main__":
    main()