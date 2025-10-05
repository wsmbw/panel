package storage

import (
	"fmt"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Storage 存储接口
type Storage struct {
	db *gorm.DB
}

// NewStorage 创建存储实例
func NewStorage(db *gorm.DB) *Storage {
	return &Storage{db: db}
}

// InitDB 初始化数据库
func InitDB(dbPath string) (*gorm.DB, error) {
	// 配置GORM
	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	}

	// 连接数据库
	db, err := gorm.Open(sqlite.Open(dbPath), config)
	if err != nil {
		return nil, fmt.Errorf("连接数据库失败: %v", err)
	}

	// 自动迁移
	err = db.AutoMigrate(
		&User{},
		&Server{},
		&Service{},
		&DockerContainer{},
		&App{},
		&Setting{},
	)
	if err != nil {
		return nil, fmt.Errorf("数据库迁移失败: %v", err)
	}

	// 初始化默认用户
	initDefaultUser(db)

	return db, nil
}

// 初始化默认用户
func initDefaultUser(db *gorm.DB) {
	var count int64
	db.Model(&User{}).Count(&count)

	if count == 0 {
		// 创建默认管理员用户
		hashedPassword, _ := hashPassword("admin123")
		defaultUser := User{
			Username: "admin",
			Password: hashedPassword,
			Email:    "admin@example.com",
			Role:     "admin",
			Active:   true,
		}
		db.Create(&defaultUser)
	}
}