package server

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"ubuntu-panel/internal/config"
	"ubuntu-panel/internal/storage"
	"ubuntu-panel/internal/api"
)

// Server 服务器实例
type Server struct {
	cfg    *config.Config
	store  *storage.Storage
	api    *api.Handler
	server *http.Server
	router *gin.Engine
}

// NewServer 创建服务器实例
func NewServer(cfg *config.Config, store *storage.Storage) *Server {
	// 设置Gin模式
	if cfg.DevMode {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// 配置CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 创建API处理器
	handler := api.NewHandler(cfg, store)

	// 创建服务器实例
	s := &Server{
		cfg:    cfg,
		store:  store,
		api:    handler,
		router: router,
	}

	// 设置路由
	s.setupRoutes()

	return s
}

// setupRoutes 设置路由
func (s *Server) setupRoutes() {
	// API路由组
	api := s.router.Group("/api")
	{
		// 认证相关路由
		auth := api.Group("/auth")
		{
			auth.POST("/login", s.api.HandleLogin)
			auth.POST("/logout", s.api.HandleLogout)
			auth.POST("/change-password", s.api.HandleChangePassword)
		}

		// 需要认证的路由
		protected := api.Group("/")
		protected.Use(s.authMiddleware())
		{
			// 用户管理
		users := protected.Group("/users")
		{
			// TODO: 实现用户管理相关处理函数
			users.GET("/", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			users.GET("/:id", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			users.POST("/", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			users.PUT("/:id", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			users.DELETE("/:id", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
		}

			// 系统监控
		system := protected.Group("/system")
		{
			system.GET("/status", s.api.HandleGetSystemStatus)
			system.GET("/resources", s.api.HandleGetSystemStatus) // 使用相同的处理器
			system.GET("/processes", s.api.HandleGetProcesses)
		}

			// 服务管理
		services := protected.Group("/services")
		{
			// TODO: 实现服务管理相关处理函数
			services.GET("/", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			services.GET("/:name", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			services.POST("/:name/start", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			services.POST("/:name/stop", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			services.POST("/:name/restart", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
		}

			// Docker管理
		if s.cfg.DockerEnabled {
			docker := protected.Group("/docker")
			{
				// TODO: 实现Docker管理相关处理函数
				docker.GET("/containers", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
				docker.GET("/containers/:id", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
				docker.POST("/containers/:id/start", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
				docker.POST("/containers/:id/stop", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
				docker.POST("/containers", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
				docker.DELETE("/containers/:id", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
				docker.GET("/images", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			}
		}

			// 文件管理
		files := protected.Group("/files")
		{
			files.GET("/", s.api.HandleListFiles)
			files.GET("/content", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			files.POST("/upload", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			files.POST("/mkdir", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			files.DELETE("/", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
		}

			// 设置管理
		settings := protected.Group("/settings")
		{
			// TODO: 实现设置管理相关处理函数
			settings.GET("/", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
			settings.PUT("/:key", func(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"}) })
		}
		}
	}

	// 静态文件服务
	staticDir := filepath.Join("web", "dist")
	if _, err := os.Stat(staticDir); err == nil {
		s.router.Static("/static", staticDir)
		s.router.StaticFile("/", filepath.Join(staticDir, "index.html"))
	}

	// 处理404
	s.router.NoRoute(func(c *gin.Context) {
		// 如果是API请求，返回404
		if len(c.Request.URL.Path) > 4 && c.Request.URL.Path[:4] == "/api" {
			c.JSON(http.StatusNotFound, gin.H{"error": "API not found"})
			return
		}

		// 否则尝试返回index.html（用于前端路由）
		if _, err := os.Stat(filepath.Join(staticDir, "index.html")); err == nil {
			c.File(filepath.Join(staticDir, "index.html"))
		} else {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		}
	})
}

// Start 启动服务器
func (s *Server) Start(addr string) error {
	s.server = &http.Server{
		Addr:    addr,
		Handler: s.router,
	}

	return s.server.ListenAndServe()
}

// Shutdown 优雅关闭服务器
func (s *Server) Shutdown() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return s.server.Shutdown(ctx)
}

// 认证中间件
func (s *Server) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// TODO: 实现JWT认证验证
		// 暂时跳过认证检查，仅作为示例
		c.Next()
	}
}