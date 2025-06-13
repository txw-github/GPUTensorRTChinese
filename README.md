# 中文电视剧音频转文字系统

专为 Windows NVIDIA RTX 3060 Ti 优化的智能转录系统，支持多种模型和GPU加速。

## 🚀 快速开始

### 在线版本 (Replit)
项目已部署在Replit环境，访问即可使用。

### 本地 Windows 运行

#### 方法1: 一键启动（推荐）
```cmd
# 双击运行
start-windows.bat
```

#### 方法2: 命令行
```cmd
# 安装依赖
npm install

# 启动服务器
set NODE_ENV=development
npx tsx server/index.ts
```

#### 方法3: PowerShell
```powershell
# 运行PowerShell脚本
.\start-powershell.ps1
```

#### 方法4: 跨平台启动脚本
```cmd
node start.js
```

## 🎯 核心功能

- **多模型支持**: Whisper Large V3, Medium, Small, FiredASR
- **GPU加速**: NVIDIA RTX 3060 Ti TensorRT优化
- **中文优化**: 多音字处理、智能标点、句段分割
- **实时监控**: GPU利用率、显存使用、处理进度
- **多格式输出**: SRT、VTT、TXT字幕文件
- **批量处理**: 支持队列管理和并发转录

## 🔧 系统要求

- **操作系统**: Windows 10/11, Linux, macOS
- **显卡**: NVIDIA RTX 3060 Ti 或更高（8GB+ VRAM推荐）
- **内存**: 8GB+ RAM
- **Node.js**: 18+ 版本
- **Python**: 3.8+ (可选，用于高级功能)

## 📊 性能特点

| 模型 | 处理速度 | 中文准确率 | 显存需求 | TensorRT |
|------|----------|------------|----------|----------|
| Whisper Large V3 | 慢但精确 | 95%+ | 4GB | ✅ |
| Whisper Medium | 平衡 | 90%+ | 2GB | ✅ |
| Whisper Small | 快速 | 85%+ | 1GB | ✅ |
| FiredASR | 专业中文 | 98%+ | 3GB | ❌ |

## 🎛️ 高级配置

### 中文处理设置
- **字体变体**: 简体/繁体/自动识别
- **多音字处理**: 基于上下文的读音推理
- **智能标点**: 自动添加标点符号
- **分句方法**: jieba/AI/基础分割

### GPU优化
- **TensorRT加速**: 自动模型优化
- **内存管理**: 智能显存分配
- **并发控制**: 多任务队列管理
- **热重载**: 无需重启的模型切换

## 🔗 API接口

### 上传转录
```bash
curl -X POST \
  -F "file=@video.mp4" \
  -F "model=whisper-large-v3" \
  -F "language=zh" \
  -F "tensorrt_enabled=true" \
  http://localhost:5000/api/transcribe
```

### 查询进度
```bash
curl http://localhost:5000/api/jobs/{job_id}
```

### 系统状态
```bash
curl http://localhost:5000/api/system/metrics
```

## 🛠️ 故障排除

### Windows环境问题
如遇到 "NODE_ENV不是内部或外部命令" 错误：
1. 使用 `start-windows.bat` 批处理文件
2. 或使用 `cross-env` 命令前缀
3. 或切换到PowerShell环境

### GPU相关问题
1. 确认NVIDIA驱动版本 > 470
2. 检查CUDA版本兼容性
3. 验证TensorRT安装状态

### 内存不足
1. 调整并发任务数量
2. 使用更小的模型
3. 清理系统缓存

## 📁 项目结构

```
├── client/              # React前端界面
├── server/              # Express后端服务
├── shared/              # 共享类型定义
├── start-windows.bat    # Windows启动脚本
├── start-powershell.ps1 # PowerShell启动脚本
├── start.js            # 跨平台启动脚本
└── README-Windows.md   # Windows详细说明
```

## 🤝 技术支持

如需帮助，请检查：
1. 系统要求是否满足
2. 依赖是否正确安装
3. GPU驱动是否最新
4. 查看控制台错误信息

## 📄 许可证

MIT License - 自由使用和修改