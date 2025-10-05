FROM golang:1.20-alpine AS backend-builder

WORKDIR /app

# 安装依赖
RUN apk add --no-cache git build-base

# 复制Go模块文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 编译后端
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o ubuntu-panel ./cmd/server

# 前端构建阶段
FROM node:16-alpine AS frontend-builder

WORKDIR /app

# 复制前端代码
COPY web/ ./

# 安装依赖
RUN npm install

# 构建前端
RUN npm run build

# 最终镜像
FROM alpine:latest

# 设置时区
RUN apk add --no-cache tzdata
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo "Asia/Shanghai" > /etc/timezone

# 创建必要的目录
RUN mkdir -p /app /app/web/dist /opt/ubuntu-panel/data

# 复制后端二进制文件
COPY --from=backend-builder /app/ubuntu-panel /app/

# 复制前端构建文件
COPY --from=frontend-builder /app/dist /app/web/dist

# 复制配置文件模板
COPY --from=backend-builder /app/config.yaml /app/config.yaml.template

# 设置工作目录
WORKDIR /app

# 暴露端口
EXPOSE 7800

# 创建启动脚本
RUN echo '#!/bin/sh
if [ ! -f /app/config.yaml ]; then
  cp /app/config.yaml.template /app/config.yaml
fi
/app/ubuntu-panel --config /app/config.yaml' > /app/start.sh && chmod +x /app/start.sh

# 数据卷
VOLUME ["/opt/ubuntu-panel/data"]

# 启动命令
CMD ["/app/start.sh"]