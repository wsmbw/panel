#!/bin/bash

# Ubuntu Panel 安装脚本
# 适用于 Ubuntu 18.04 LTS 及以上版本

echo "========================================"
echo "Ubuntu Panel 安装脚本"
echo "========================================"

# 检查是否以 root 用户运行
if [ "$(id -u)" != "0" ]; then
   echo "错误: 请以 root 用户运行此脚本"
   exit 1
fi

# 检查系统版本
if ! grep -q "Ubuntu 18\.04\|Ubuntu 20\.04\|Ubuntu 22\.04" /etc/os-release; then
    echo "警告: 此脚本推荐在 Ubuntu 18.04/20.04/22.04 LTS 上运行"
    read -p "是否继续安装? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 定义变量
INSTALL_DIR="/opt/ubuntu-panel"
DATA_DIR="/opt/ubuntu-panel/data"
LOG_DIR="/var/log/ubuntu-panel"
SERVICE_NAME="ubuntu-panel"
GITHUB_REPO="ubuntu-panel"

# 创建必要的目录
echo "创建必要的目录..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$LOG_DIR"

# 安装依赖
echo "安装必要的依赖..."
apt update
avt install -y curl wget git build-essential

# 检查并安装 Go
if ! command -v go &> /dev/null; then
    echo "安装 Go 1.20..."
    wget -q https://go.dev/dl/go1.20.linux-amd64.tar.gz
    tar -C /usr/local -xzf go1.20.linux-amd64.tar.gz
    rm go1.20.linux-amd64.tar.gz
    echo "export PATH=$PATH:/usr/local/go/bin" > /etc/profile.d/go.sh
    source /etc/profile.d/go.sh
fi

# 检查并安装 Node.js
if ! command -v node &> /dev/null; then
    echo "安装 Node.js 16..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
    apt install -y nodejs
fi

# 克隆代码库
echo "克隆代码库..."
cd "$INSTALL_DIR"
git clone https://github.com/$GITHUB_REPO/$GITHUB_REPO.git .

# 安装后端依赖
echo "安装后端依赖..."
go mod tidy

# 编译后端
echo "编译后端..."
go build -o ubuntu-panel ./cmd/server

# 安装前端依赖
echo "安装前端依赖..."
cd web
npm install

# 构建前端
echo "构建前端..."
npm run build

# 创建配置文件
echo "创建配置文件..."
cd ..
cat > config.yaml << EOF
host: 0.0.0.0
port: 7800
data_dir: $DATA_DIR
log_level: info
log_file: $LOG_DIR/ubuntu-panel.log
jwt_secret: $(openssl rand -hex 32)
session_timeout: 86400
docker_enabled: true
docker_socket: /var/run/docker.sock
EOF

# 创建系统服务
echo "创建系统服务..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Ubuntu Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/ubuntu-panel --config $INSTALL_DIR/config.yaml
Restart=on-failure
RestartSec=5
StandardOutput=append:$LOG_DIR/ubuntu-panel.log
StandardError=append:$LOG_DIR/ubuntu-panel.log

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
echo "启动服务..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# 检查服务状态
sleep 3
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "========================================"
    echo "Ubuntu Panel 安装成功!"
    echo "========================================"
    echo "面板地址: http://$(hostname -I | awk '{print $1}'):7800"
    echo "默认用户名: admin"
    echo "默认密码: admin123"
    echo ""
    echo "请在首次登录后立即修改密码!"
else
    echo "========================================"
    echo "Ubuntu Panel 安装失败!"
    echo "========================================"
    echo "请检查日志: journalctl -u $SERVICE_NAME"
    exit 1
fi