#!/bin/bash

# Ubuntu Panel 开发启动脚本
echo "========================================"
echo "Ubuntu Panel 开发启动脚本"
echo "========================================"

# 检查是否安装了Go
if ! command -v go &> /dev/null; then
    echo "错误: 未检测到 Go。请先安装 Go 1.20 或更高版本。"
    exit 1
fi

# 检查是否安装了Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到 Node.js。请先安装 Node.js 16 或更高版本。"
    exit 1
fi

# 设置开发环境变量
export UBUNTU_PANEL_DEV_MODE=true
export UBUNTU_PANEL_PORT=7800

# 创建必要的目录
mkdir -p data

# 下载Go依赖
echo "下载Go依赖..."
go mod tidy

# 启动后端服务
echo "启动后端服务..."
cd cmd/server
nohup go run main.go --dev > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务启动成功，PID: $BACKEND_PID"

# 启动前端开发服务器
echo "启动前端开发服务器..."
cd ../../web
npm install
echo "启动前端服务在 http://localhost:3000"
npm run dev