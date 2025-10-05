package storage

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"size:50;not null;unique" json:"username"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	Email     string    `gorm:"size:100;unique" json:"email"`
	Role      string    `gorm:"size:20;default:'user'" json:"role"`
	Active    bool      `gorm:"default:true" json:"active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Server 服务器模型
type Server struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"size:255" json:"description"`
	IP          string    `gorm:"size:50" json:"ip"`
	SSHPort     int       `gorm:"default:22" json:"ssh_port"`
	Status      string    `gorm:"size:20;default:'unknown'" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Service 服务模型
type Service struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"size:255" json:"description"`
	Status      string    `gorm:"size:20" json:"status"`
	Enabled     bool      `json:"enabled"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// DockerContainer Docker容器模型
type DockerContainer struct {
	ID          string    `gorm:"primaryKey;size:100" json:"id"`
	Name        string    `gorm:"size:255" json:"name"`
	Image       string    `gorm:"size:255" json:"image"`
	Status      string    `gorm:"size:50" json:"status"`
	Ports       string    `gorm:"type:text" json:"ports"` // JSON格式存储端口映射
	Env         string    `gorm:"type:text" json:"env"`   // JSON格式存储环境变量
	Volumes     string    `gorm:"type:text" json:"volumes"` // JSON格式存储卷挂载
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// App 应用模型
type App struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Version     string    `gorm:"size:50" json:"version"`
	Description string    `gorm:"size:255" json:"description"`
	Status      string    `gorm:"size:20;default:'installed'" json:"status"`
	Config      string    `gorm:"type:text" json:"config"` // JSON格式存储配置
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Setting 系统设置模型
type Setting struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Key         string    `gorm:"size:100;not null;unique" json:"key"`
	Value       string    `gorm:"type:text" json:"value"`
	Description string    `gorm:"size:255" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// 密码哈希函数
func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword 验证密码
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// BeforeUpdate GORM钩子：更新前处理
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	// 如果密码被修改，则重新哈希
	if tx.Statement.Changed("Password") {
		hashedPassword, err := hashPassword(u.Password)
		if err != nil {
			return err
		}
		tx.Statement.SetColumn("Password", hashedPassword)
	}
	return nil
}