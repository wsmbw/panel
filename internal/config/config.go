package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

// Config 应用配置结构
type Config struct {
	// 服务器配置
	Host string `mapstructure:"host"`
	Port int    `mapstructure:"port"`

	// 数据目录
	DataDir string `mapstructure:"data_dir"`

	// 日志配置
	LogLevel string `mapstructure:"log_level"`
	LogFile  string `mapstructure:"log_file"`

	// 安全配置
	JWTSecret     string `mapstructure:"jwt_secret"`
	SessionTimeout int   `mapstructure:"session_timeout"`

	// Docker配置
	DockerEnabled bool   `mapstructure:"docker_enabled"`
	DockerSocket  string `mapstructure:"docker_socket"`

	// 开发模式
	DevMode bool
}

// Load 加载配置
func Load(configPath string, devMode bool) (*Config, error) {
	v := viper.New()

	// 设置默认值
	v.SetDefault("host", "0.0.0.0")
	v.SetDefault("port", 7800)
	v.SetDefault("data_dir", "/opt/ubuntu-panel")
	v.SetDefault("log_level", "info")
	v.SetDefault("log_file", "")
	v.SetDefault("jwt_secret", "ubuntu_panel_secret_key")
	v.SetDefault("session_timeout", 86400) // 24小时
	v.SetDefault("docker_enabled", true)
	v.SetDefault("docker_socket", "/var/run/docker.sock")

	// 如果提供了配置文件路径
	if configPath != "" {
		v.SetConfigFile(configPath)
	} else {
		// 尝试从默认位置加载配置
		v.SetConfigName("config")
		v.SetConfigType("yaml")
		v.AddConfigPath("./")
		v.AddConfigPath("/etc/ubuntu-panel/")
		v.AddConfigPath("/opt/ubuntu-panel/")
	}

	// 读取环境变量
	v.AutomaticEnv()
	v.SetEnvPrefix("UBUNTU_PANEL")

	// 尝试读取配置文件
	if err := v.ReadInConfig(); err != nil {
		// 如果是因为配置文件不存在，可以继续使用默认值
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("读取配置文件失败: %v", err)
		}
	}

	// 解析配置
	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("解析配置失败: %v", err)
	}

	// 设置开发模式
	cfg.DevMode = devMode

	// 确保数据目录存在
	if err := os.MkdirAll(cfg.DataDir, 0755); err != nil {
		return nil, fmt.Errorf("创建数据目录失败: %v", err)
	}

	// 如果没有指定日志文件，使用数据目录下的默认日志文件
	if cfg.LogFile == "" {
		cfg.LogFile = filepath.Join(cfg.DataDir, "ubuntu-panel.log")
	}

	return &cfg, nil
}