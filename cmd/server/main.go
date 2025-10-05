package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"ubuntu-panel/internal/config"
	"ubuntu-panel/internal/server"
	"ubuntu-panel/internal/storage"
)

func main() {
	// 解析命令行参数
	var (
		devMode bool
		configPath string
	)
	flag.BoolVar(&devMode, "dev", false, "开发模式")
	flag.StringVar(&configPath, "config", "", "配置文件路径")
	flag.Parse()

	// 初始化配置
	cfg, err := config.Load(configPath, devMode)
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 初始化数据库
	dbPath := filepath.Join(cfg.DataDir, "panel.db")
	db, err := storage.InitDB(dbPath)
	if err != nil {
		log.Fatalf("初始化数据库失败: %v", err)
	}

	// 初始化存储
	store := storage.NewStorage(db)

	// 创建服务器实例
	srv := server.NewServer(cfg, store)

	// 启动服务器
	go func() {
		addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
		log.Printf("服务器启动在 %s", addr)
		if err := srv.Start(addr); err != nil {
			log.Fatalf("服务器启动失败: %v", err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("正在关闭服务器...")
	srv.Shutdown()
	log.Println("服务器已关闭")
}