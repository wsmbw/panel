package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
	"ubuntu-panel/internal/config"
	"ubuntu-panel/internal/storage"
)

// Handler API处理器
type Handler struct {
	cfg   *config.Config
	store *storage.Storage
}

// NewHandler 创建API处理器
func NewHandler(cfg *config.Config, store *storage.Storage) *Handler {
	return &Handler{
		cfg:   cfg,
		store: store,
	}
}

// 系统相关处理函数

// 系统监控处理函数

// HandleGetSystemStatus 获取系统状态
func (h *Handler) HandleGetSystemStatus(c *gin.Context) {
	// 获取CPU使用率
	cpuPercent, err := cpu.Percent(0, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取CPU信息失败"})
		return
	}

	// 获取CPU温度信息
	var cpuTemp float64
	// 尝试从/sys/class/thermal/目录读取CPU温度
	thermalFiles, err := filepath.Glob("/sys/class/thermal/thermal_zone*")
	if err == nil && len(thermalFiles) > 0 {
		for _, file := range thermalFiles {
			typeFile := filepath.Join(file, "type")
			tempFile := filepath.Join(file, "temp")
			
			// 读取类型文件，检查是否为CPU相关
			typeData, err := os.ReadFile(typeFile)
			if err == nil {
				typeStr := string(typeData)
				// 检查是否包含cpu、core或thermal字样
				if len(typeStr) > 0 && (contains(typeStr, "cpu") || contains(typeStr, "core") || contains(typeStr, "thermal")) {
					// 读取温度文件
					tempData, err := os.ReadFile(tempFile)
					if err == nil {
						temp, err := strconv.ParseFloat(string(tempData), 64)
						if err == nil {
							// 通常温度单位是milli-degrees Celsius，转换为摄氏度
							cpuTemp = temp / 1000.0
							break
						}
					}
				}
			}
		}
	}

	// 获取内存信息
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取内存信息失败"})
		return
	}

	// 获取磁盘信息
	diskInfo, err := disk.Usage("/")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取磁盘信息失败"})
		return
	}

	// 获取网络信息
	netInfo, err := net.IOCounters(true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取网络信息失败"})
		return
	}

	status := gin.H{
		"cpu": gin.H{
			"usage_percent": cpuPercent[0],
			"temperature":   cpuTemp,
		},
		"memory": gin.H{
			"total":        memInfo.Total,
			"used":         memInfo.Used,
			"free":         memInfo.Free,
			"usage_percent": memInfo.UsedPercent,
		},
		"disk": gin.H{
			"total":        diskInfo.Total,
			"used":         diskInfo.Used,
			"free":         diskInfo.Free,
			"usage_percent": diskInfo.UsedPercent,
		},
		"network": netInfo,
	}

	c.JSON(http.StatusOK, status)
}

// HandleGetProcesses 获取进程列表
func (h *Handler) HandleGetProcesses(c *gin.Context) {
	processes, err := process.Processes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取进程列表失败"})
		return
	}

	var processList []gin.H
	for _, p := range processes {
		pid := p.Pid
		name, _ := p.Name()
		cpuPercent, _ := p.CPUPercent()
		memPercent, _ := p.MemoryPercent()
		status, _ := p.Status()

		processList = append(processList, gin.H{
			"pid":         pid,
			"name":        name,
			"cpu_percent": cpuPercent,
			"mem_percent": memPercent,
			"status":      status,
		})
	}

	c.JSON(http.StatusOK, processList)
}

// 文件管理处理函数

// HandleLogin 处理登录请求
func (h *Handler) HandleLogin(c *gin.Context) {
	// 简单实现，用于测试
	c.JSON(http.StatusOK, gin.H{
		"message": "Login endpoint reached",
		"token":   "mock-token-for-testing",
	})
}

// HandleLogout 处理登出请求
func (h *Handler) HandleLogout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}

// HandleChangePassword 处理修改密码请求
func (h *Handler) HandleChangePassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// HandleListFiles 列出文件
func (h *Handler) HandleListFiles(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		path = "/"
	}

	entries, err := os.ReadDir(path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "读取目录失败"})
		return
	}

	var files []gin.H
	for _, entry := range entries {
		info, _ := entry.Info()
		files = append(files, gin.H{
			"name":     entry.Name(),
			"is_dir":   entry.IsDir(),
			"size":     info.Size(),
			"mod_time": info.ModTime(),
		})
	}

	c.JSON(http.StatusOK, files)
}

// 系统相关辅助函数

// contains 检查字符串是否包含子串
func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}