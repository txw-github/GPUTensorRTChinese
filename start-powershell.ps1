# PowerShell 启动脚本
Write-Host "🚀 启动中文电视剧转录系统..." -ForegroundColor Green
Write-Host "📍 检测到 PowerShell 环境" -ForegroundColor Cyan

# 设置环境变量
$env:NODE_ENV = "development"

# 启动服务器
Write-Host "🔧 正在启动服务器..." -ForegroundColor Yellow
try {
    npx tsx server/index.ts
} catch {
    Write-Host "❌ 启动失败: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "按任意键退出"
}