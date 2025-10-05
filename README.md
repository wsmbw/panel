# Ubuntu Panel

一个类似1panel的Ubuntu服务器管理面板，提供简单易用的服务器管理功能。

## 功能特性

- 系统监控（CPU、内存、磁盘、网络）
- 用户管理
- 文件管理
- 服务管理
- Docker容器管理
- 应用部署
- 安全设置

## 安装要求

- Ubuntu 18.04 LTS 或更高版本
- 最低 1GB RAM
- 20GB 磁盘空间
- Go 1.20+
- Node.js 16+

## 安装方法

```bash
# 克隆仓库
git clone https://github.com/yourusername/ubuntu-panel.git
cd ubuntu-panel

# 安装后端依赖
go mod tidy

# 编译后端
go build -o ubuntu-panel ./cmd/server

# 安装前端依赖
cd web
npm install

# 构建前端
npm run build

# 运行面板
cd ..
./ubuntu-panel start
```

## 使用说明

安装完成后，可以通过浏览器访问 `http://服务器IP:7800` 来使用面板。默认用户名和密码：
- 用户名：admin
- 密码：admin123

首次登录后请立即修改密码。

## 开发指南

### 后端开发

```bash
# 运行开发服务器
go run ./cmd/server/main.go --dev
```

### 前端开发

```bash
cd web
npm run dev
```

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进这个项目。

## 许可证

本项目采用MIT许可证。