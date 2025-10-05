# 简单的Ubuntu Panel打包脚本

Write-Host "开始打包Ubuntu Panel..."

# 创建输出目录
$outputDir = ".\ubuntu-panel-package"
if (Test-Path $outputDir) {
    Remove-Item -Recurse -Force $outputDir
}
New-Item -ItemType Directory -Path $outputDir | Out-Null
New-Item -ItemType Directory -Path "$outputDir\web\dist" | Out-Null

# 构建前端
Write-Host "正在构建前端..."
Push-Location .\web
npm install
npm run build
Pop-Location

# 复制前端文件
Copy-Item -Recurse .\web\dist\* -Destination "$outputDir\web\dist\"

# 创建配置文件模板
Write-Host "正在创建配置文件..."
$configContent = @"
# Ubuntu Panel 配置文件
host: 0.0.0.0
port: 7800
data_dir: ./data
log_level: info
log_file: ./ubuntu-panel.log
jwt_secret: default_secret_key
session_timeout: 86400
docker_enabled: true
docker_socket: /var/run/docker.sock
"@
$configContent | Out-File -FilePath "$outputDir\config.yaml.template" -Encoding utf8

# 创建Windows启动脚本
$batchContent = @"
@echo off
echo 启动Ubuntu Panel服务...
mkdir data 2>nul
if not exist config.yaml (
    type config.yaml.template > config.yaml
    echo 已创建默认配置文件
)
if exist ubuntu-panel.exe (
    ubuntu-panel.exe --config config.yaml
) else (
    echo 错误: 未找到可执行文件 ubuntu-panel.exe
    pause
)
"@
$batchContent | Out-File -FilePath "$outputDir\start.bat" -Encoding ascii

# 创建Linux启动脚本
$shContent = @"
#!/bin/bash
echo "启动Ubuntu Panel服务..."
mkdir -p data
if [ ! -f config.yaml ]; then
    cp config.yaml.template config.yaml
    echo "已创建默认配置文件"
fi
./ubuntu-panel --config config.yaml
"@
$shContent | Out-File -FilePath "$outputDir\start.sh" -Encoding ascii

Write-Host "========================================"
Write-Host "打包完成！" -ForegroundColor Green
Write-Host "输出目录: $outputDir"
Write-Host "注意: 后端可执行文件需要在Linux环境中编译"
Write-Host "========================================"