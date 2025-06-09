# VideoSubtitle Transcriber

A high-performance GPU-accelerated video subtitle transcription system with TensorRT optimization and advanced Chinese text processing capabilities.

## Features

### Core Capabilities
- **GPU Acceleration**: CUDA-optimized audio processing pipeline with up to 3x speedup
- **TensorRT Optimization**: Model acceleration for faster inference 
- **Advanced Chinese NLP**: Multi-pronunciation character support and intelligent sentence segmentation
- **Real-time Processing**: Live transcription updates via WebSocket
- **Multiple Formats**: Export to SRT, VTT, and TXT formats
- **Batch Processing**: Handle multiple videos concurrently
- **Web Interface**: Modern React-based UI for easy video upload and management

### Chinese Text Processing
- **Multi-pronunciation Characters (多音字)**: Context-aware pronunciation handling
- **Smart Punctuation**: Automatic punctuation and sentence boundary detection
- **Jieba Segmentation**: Advanced word segmentation for natural sentence flow
- **Traditional/Simplified Support**: Auto-detection and conversion
- **Text Quality Analysis**: Comprehensive analysis of transcription quality

### Performance Monitoring
- **Real-time GPU Utilization**: Live monitoring of GPU usage and memory
- **System Metrics**: CPU, RAM, and temperature tracking
- **Processing Stats**: Speedup analysis and accuracy metrics
- **Queue Management**: Intelligent job scheduling across multiple GPUs

## System Requirements

### Hardware
- **GPU**: NVIDIA GPU with CUDA Compute Capability 6.0+
- **VRAM**: Minimum 4GB, recommended 8GB+
- **RAM**: Minimum 16GB, recommended 32GB+
- **Storage**: SSD recommended for better I/O performance

### Software
- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **CUDA**: Version 11.8 or 12.x
- **TensorRT**: Version 8.6+
- **Python**: 3.8+
- **Node.js**: 18+

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/your-repo/video-subtitle-transcriber.git
cd video-subtitle-transcriber
