# Windows 本地安装详细指南

## 第一步：安装 Node.js
1. 访问 https://nodejs.org/
2. 下载 "LTS" 版本（推荐 18.x 或 20.x）
3. 运行安装程序，保持默认设置
4. 安装完成后，打开命令提示符，输入：
   ```cmd
   node --version
   npm --version
   ```
   如果显示版本号，说明安装成功

## 第二步：下载并解压项目
1. 将项目文件夹解压到桌面或其他位置
2. 确保文件夹包含以下文件：
   - package.json
   - server/ 文件夹
   - client/ 文件夹
   - start-windows.bat

## 第三步：一键启动（推荐方法）
**直接双击 `start-windows.bat` 文件**

脚本会自动完成：
- 检查 Node.js 环境
- 自动安装依赖包
- 设置环境变量
- 启动服务器

启动成功后，打开浏览器访问：http://localhost:5000

## 第四步：手动安装方法（备用）

### 方法A：使用 cross-env
```cmd
# 进入项目目录
cd D:\Desktop\GPUTensorRTChinese-main

# 安装依赖
npm install

# 使用 cross-env 启动
npx cross-env NODE_ENV=development tsx server/index.ts
```

### 方法B：使用 set 命令
```cmd
# 进入项目目录
cd D:\Desktop\GPUTensorRTChinese-main

# 设置环境变量并启动
set NODE_ENV=development && npx tsx server/index.ts
```

### 方法C：使用 PowerShell
```powershell
# 进入项目目录
cd D:\Desktop\GPUTensorRTChinese-main

# 设置环境变量
$env:NODE_ENV="development"

# 启动服务器
npx tsx server/index.ts
```

## 常见问题解决

### 问题1：NODE_ENV 不是内部或外部命令
**解决方案：** 使用上述方法A或B，或直接双击 start-windows.bat

### 问题2：端口被占用
**解决方案：**
```cmd
# 查看端口占用
netstat -ano | findstr :5000

# 结束占用进程（替换PID为实际进程号）
taskkill /PID [进程号] /F
```

### 问题3：权限不足
**解决方案：** 右键命令提示符，选择"以管理员身份运行"

### 问题4：依赖安装失败
**解决方案：**
```cmd
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules
npm install
```

## 验证安装成功
启动后应该看到：
```
[express] serving on port 5000
```

然后访问 http://localhost:5000 应该能看到转录系统界面。

## GPU 要求（可选）
- NVIDIA RTX 3060 Ti 或更高
- 最新 NVIDIA 驱动程序
- CUDA 11.8+ （用于 GPU 加速）
- TensorRT 8.6+（用于模型优化）

没有 GPU 也可以使用 CPU 模式运行。