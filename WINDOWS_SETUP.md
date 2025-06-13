# Windows 部署指南 - 中文视频转录系统

## 快速启动（推荐方式）

### 方法1: 使用批处理文件
```bash
# 双击运行
windows-dev.bat
```

### 方法2: 使用PowerShell（管理员权限）
```powershell
# 右键"以管理员身份运行PowerShell"
.\windows-dev.ps1
```

### 方法3: 手动命令行
```bash
# 设置环境变量并启动
set NODE_ENV=development && tsx server/windows-server.ts
```

## 解决常见问题

### 1. 端口绑定错误 (ENOTSUP)
- **问题**: `Error: listen ENOTSUP: operation not supported on socket 0.0.0.0:5000`
- **解决**: 使用 `windows-server.ts` 代替默认服务器配置

### 2. NODE_ENV 命令不识别
- **问题**: `'NODE_ENV' 不是内部或外部命令`
- **解决**: 使用 `set NODE_ENV=development&&` 语法

### 3. tsx 命令找不到
```bash
npm install -g tsx
# 或者使用本地安装
npx tsx server/windows-server.ts
```

## GPU 要求
- NVIDIA RTX 3060 Ti (推荐)
- 8GB+ VRAM
- CUDA 11.8+ 驱动
- TensorRT 8.6+ (可选，用于加速)

## 访问应用
启动成功后访问: http://localhost:5000

## 功能特性
- 多模型支持：Whisper Large V3、Medium、Small
- FiredASR 中文专业识别
- GPU 实时监控
- TensorRT 硬件加速
- 智能中文分词和标点
- SRT/VTT 字幕导出

## 性能优化建议
1. 关闭不必要的后台程序释放GPU资源
2. 使用TensorRT加速模式
3. 根据显存选择合适的模型大小
4. 确保系统有足够的散热