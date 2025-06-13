# 中文电视剧转录系统 - Windows 安装指南

## Windows 本地运行方法

### 方法1: 使用批处理文件（推荐）
1. 双击 `start-windows.bat` 文件启动系统
2. 系统会自动设置环境变量并启动服务器
3. 打开浏览器访问 `http://localhost:5000`

### 方法2: 手动命令行
在项目目录中运行：
```cmd
set NODE_ENV=development
npx tsx server/index.ts
```

### 方法3: PowerShell
在PowerShell中运行：
```powershell
$env:NODE_ENV="development"
npx tsx server/index.ts
```

## 系统要求
- Node.js 18+ 
- Windows 10/11
- NVIDIA RTX 3060 Ti 或更高（用于GPU加速）
- 至少8GB内存

## 安装依赖
```cmd
npm install
```

## 功能特性
- ✅ 多模型音频转录（Whisper、FiredASR）
- ✅ GPU加速支持
- ✅ TensorRT优化
- ✅ 中文文本处理
- ✅ 实时系统监控
- ✅ 多格式输出（SRT、VTT、TXT）

## 故障排除
如果遇到"NODE_ENV不是内部或外部命令"错误，请使用上述Windows兼容的启动方法。

## 在线版本
项目也可以在Replit环境中运行，无需本地安装。