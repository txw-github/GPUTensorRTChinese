#!/bin/bash

# GPU加速视频字幕转录系统 - 启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查运行环境..."
    
    # 检查Python虚拟环境
    if [[ ! -d "venv" ]]; then
        log_error "Python虚拟环境不存在，请先运行: scripts/install.sh"
        exit 1
    fi
    
    # 检查配置文件
    if [[ ! -f "config.json" ]]; then
        log_error "配置文件不存在，请先运行: scripts/install.sh"
        exit 1
    fi
    
    # 检查必要目录
    mkdir -p uploads temp logs models
    
    log_info "环境检查通过"
}

# 检查GPU状态
check_gpu() {
    log_info "检查GPU状态..."
    
    if ! command -v nvidia-smi &> /dev/null; then
        log_error "nvidia-smi不可用，请检查NVIDIA驱动"
        exit 1
    fi
    
    # 显示GPU信息
    nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits
    
    # 检查CUDA
    source venv/bin/activate
    python3 -c "
import torch
if not torch.cuda.is_available():
    print('CUDA不可用')
    exit(1)
print(f'CUDA可用: {torch.cuda.get_device_name()}')
" || exit 1
    
    log_info "GPU检查通过"
}

# 预热模型
warmup_model() {
    log_info "预热Whisper模型..."
    
    source venv/bin/activate
    python3 -c "
import whisper
import os
import json

# 读取配置
with open('config.json', 'r') as f:
    config = json.load(f)

model_size = config['whisper']['model_size']
print(f'加载模型: {model_size}')

# 下载并缓存模型
model = whisper.load_model(model_size)
print('模型预热完成')
"
    
    log_info "模型预热完成"
}

# 启动开发服务器
start_dev() {
    log_info "启动开发服务器..."
    
    check_environment
    check_gpu
    warmup_model
    
    log_info "正在启动应用..."
    log_info "访问地址: http://localhost:5000"
    log_info "按 Ctrl+C 停止服务"
    
    npm run dev
}

# 启动生产服务器
start_prod() {
    log_info "启动生产服务器..."
    
    check_environment
    check_gpu
    
    # 构建前端
    log_info "构建前端..."
    npm run build
    
    # 启动生产服务器
    log_info "启动生产服务器..."
    npm start
}

# 停止服务
stop_service() {
    log_info "停止服务..."
    
    # 查找并停止相关进程
    pkill -f "npm run dev" || true
    pkill -f "npm start" || true
    pkill -f "node server" || true
    
    log_info "服务已停止"
}

# 显示状态
show_status() {
    log_info "服务状态:"
    
    # 检查进程
    if pgrep -f "npm run dev" > /dev/null; then
        echo "  开发服务器: 运行中"
    elif pgrep -f "npm start" > /dev/null; then
        echo "  生产服务器: 运行中"
    else
        echo "  服务器: 未运行"
    fi
    
    # 检查端口
    if netstat -tuln | grep :5000 > /dev/null 2>&1; then
        echo "  端口5000: 已占用"
    else
        echo "  端口5000: 可用"
    fi
    
    # GPU状态
    if command -v nvidia-smi &> /dev/null; then
        echo "  GPU状态:"
        nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits | while read line; do
            echo "    $line"
        done
    fi
}

# 清理缓存
clean_cache() {
    log_info "清理缓存..."
    
    # 清理上传文件
    if [[ -d "uploads" ]]; then
        find uploads -type f -mtime +7 -delete
        log_info "清理了7天前的上传文件"
    fi
    
    # 清理临时文件
    if [[ -d "temp" ]]; then
        rm -rf temp/*
        log_info "清理了临时文件"
    fi
    
    # 清理日志文件
    if [[ -d "logs" ]]; then
        find logs -name "*.log" -size +100M -delete
        log_info "清理了大于100MB的日志文件"
    fi
}

# 显示帮助
show_help() {
    echo "GPU加速视频字幕转录系统 - 启动脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  dev      启动开发服务器 (默认)"
    echo "  prod     启动生产服务器"
    echo "  stop     停止服务"
    echo "  status   显示服务状态"
    echo "  clean    清理缓存文件"
    echo "  help     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 dev     # 启动开发服务器"
    echo "  $0 prod    # 启动生产服务器"
    echo "  $0 stop    # 停止所有服务"
}

# 主函数
main() {
    case "${1:-dev}" in
        "dev")
            start_dev
            ;;
        "prod")
            start_prod
            ;;
        "stop")
            stop_service
            ;;
        "status")
            show_status
            ;;
        "clean")
            clean_cache
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"