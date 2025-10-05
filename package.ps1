# Ubuntu Panel Windows打包脚本
# 此脚本用于在Windows环境下构建项目并创建发布包

Write-Host "========================================"
Write-Host "Ubuntu Panel Windows打包脚本"
Write-Host "========================================"

# 检查必要的工具
function Check-Dependencies {
    Write-Host "检查必要的工具..."
    
    # 检查Go
    if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
        Write-Host "错误: 未检测到 Go。请先安装 Go 1.20 或更高版本。" -ForegroundColor Red
        exit 1
    }
    
    # 检查Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "错误: 未检测到 Node.js。请先安装 Node.js 16 或更高版本。" -ForegroundColor Red
        exit 1
    }
    
    # 检查tar和gzip（在Windows上可能需要Git Bash或WSL）
    if (-not (Get-Command tar -ErrorAction SilentlyContinue)) {
        Write-Host "警告: 未检测到tar命令。部分功能可能受限。" -ForegroundColor Yellow
    }
    
    Write-Host "工具检查完成！" -ForegroundColor Green
}

# 编译后端
function Build-Backend {
    Write-Host "编译后端服务..."
    
    try {
        # 下载依赖
        go mod tidy
        
        # 在Windows上编译Linux版本的二进制文件
        $env:CGO_ENABLED = "0"
        $env:GOOS = "linux"
        $env:GOARCH = "amd64"
        
        go build -a -installsuffix cgo -o ubuntu-panel.exe ./cmd/server
        
        Write-Host "后端编译成功！" -ForegroundColor Green
    } catch {
        Write-Host "错误: 后端编译失败！ $_" -ForegroundColor Red
        exit 1
    }
}

# 构建前端
function Build-Frontend {
    Write-Host "构建前端项目..."
    
    try {
        Set-Location web
        
        # 安装依赖
        npm install
        
        # 构建项目
        npm run build
        
        Set-Location ..
        Write-Host "前端构建成功！" -ForegroundColor Green
    } catch {
        Write-Host "错误: 前端构建失败！ $_" -ForegroundColor Red
        exit 1
    }
}

# 创建配置文件模板
function Create-ConfigTemplate {
    Write-Host "创建配置文件模板..."
    
    @"
# Ubuntu Panel 配置文件

# 服务配置
host: 0.0.0.0
port: 7800

# 数据目录
data_dir: ./data

# 日志配置
log_level: info
log_file: ./ubuntu-panel.log

# JWT配置
jwt_secret: ${JWT_SECRET:-default_secret_key}
session_timeout: 86400

# Docker配置
docker_enabled: true
docker_socket: /var/run/docker.sock
"@ | Out-File -FilePath config.yaml.template -Encoding utf8
    
    Write-Host "配置文件模板创建成功！" -ForegroundColor Green
}

# 创建启动脚本
function Create-StartScript {
    Write-Host "创建启动脚本..."
    
    @"
#!/bin/bash

# Ubuntu Panel 启动脚本

echo "========================================"
echo "Ubuntu Panel 启动脚本"
echo "========================================"

# 创建必要的目录
mkdir -p data

# 检查配置文件
if [ ! -f config.yaml ]; then
    echo "未找到配置文件，使用默认配置..."
    
    # 生成随机JWT密钥
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "random_secret_key_$(date +%s)")
    
    # 创建配置文件
    sed "s/\${JWT_SECRET:-default_secret_key}/$JWT_SECRET/g" config.yaml.template > config.yaml
    
    echo "配置文件已创建: config.yaml"
fi

# 启动应用
echo "启动 Ubuntu Panel 服务..."
echo "服务将在 http://0.0.0.0:7800 上运行"
echo "按 Ctrl+C 停止服务"
echo "========================================"

./ubuntu-panel --config config.yaml
"@ | Out-File -FilePath run_ubuntu_panel.sh -Encoding ascii
    
    Write-Host "启动脚本创建成功: run_ubuntu_panel.sh" -ForegroundColor Green
}

# 创建Windows启动批处理脚本
function Create-WindowsBatch {
    Write-Host "创建Windows启动批处理脚本..."
    
    @"
@echo off

echo ========================================
echo Ubuntu Panel Windows启动脚本
echo ========================================

:: 创建必要的目录
mkdir data 2>nul

:: 检查配置文件
if not exist config.yaml (
    echo 未找到配置文件，使用默认配置...
    
    :: 创建配置文件
    type config.yaml.template > config.yaml
    
    echo 配置文件已创建: config.yaml
)

:: 启动应用
echo 启动 Ubuntu Panel 服务...
echo 服务将在 http://0.0.0.0:7800 上运行
echo 按 Ctrl+C 停止服务
echo ========================================

ubuntu-panel.exe --config config.yaml
"@ | Out-File -FilePath run_ubuntu_panel.bat -Encoding ascii
    
    Write-Host "Windows启动批处理脚本创建成功: run_ubuntu_panel.bat" -ForegroundColor Green
}

# 创建发布包
function Create-ReleasePackage {
    Write-Host "创建发布包..."
    
    # 创建打包目录
    $PackageDir = "ubuntu-panel-release"
    if (Test-Path $PackageDir) {
        Remove-Item -Recurse -Force $PackageDir
    }
    mkdir -p "$PackageDir"
    mkdir -p "$PackageDir/web/dist"
    
    # 复制文件到打包目录
    Copy-Item ubuntu-panel.exe -Destination "$PackageDir/"
    Copy-Item config.yaml.template -Destination "$PackageDir/"
    Copy-Item run_ubuntu_panel.sh -Destination "$PackageDir/"
    Copy-Item run_ubuntu_panel.bat -Destination "$PackageDir/"
    Copy-Item -Recurse web/dist -Destination "$PackageDir/web/"
    
    # 创建zip压缩包
    $ZipFile = "ubuntu-panel-release.zip"
    if (Test-Path $ZipFile) {
        Remove-Item $ZipFile -Force
    }
    
    try {
        Compress-Archive -Path "$PackageDir\*" -DestinationPath $ZipFile -Force
        Write-Host "发布包创建成功: $ZipFile" -ForegroundColor Green
    } catch {
        Write-Host "警告: 创建压缩包失败，将使用未压缩的目录作为发布包" -ForegroundColor Yellow
    }
    
    Write-Host "发布目录: $PackageDir" -ForegroundColor Green
}

# 主函数
function Main {
    Check-Dependencies
    Build-Backend
    Build-Frontend
    Create-ConfigTemplate
    Create-StartScript
    Create-WindowsBatch
    Create-ReleasePackage
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "打包过程已完成!" -ForegroundColor Green
    Write-Host "在Linux环境中使用: run_ubuntu_panel.sh" -ForegroundColor Green
    Write-Host "在Windows环境中使用: run_ubuntu_panel.bat" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}

# 执行主函数
Main