package app

import (
	"crm-backend/internal/config"
	"crm-backend/internal/database"
	"crm-backend/internal/domain"
	"crm-backend/internal/handler"
	"crm-backend/internal/repository"
	"crm-backend/internal/security"
	"crm-backend/internal/service"
	"fmt"

	"github.com/gin-gonic/gin"
)

func Run() error {
	cfg := config.Load()

	if cfg.JWTAccessSecret == "" || cfg.JWTRefreshSecret == "" {
		return fmt.Errorf("jwt secrets must be configured")
	}

	db, err := database.ConnectDatabase(cfg.DatabaseDSN())
	if err != nil {
		return err
	}

	if err := db.AutoMigrate(&domain.User{}); err != nil {
		return fmt.Errorf("migrate database: %w", err)
	}

	redisClient, err := config.NewRedisClient(
		cfg.RedisAddr,
		cfg.RedisPassword,
		cfg.RedisDB,
	)
	if err != nil {
		return fmt.Errorf("connect redis: %w", err)
	}

	defer redisClient.Close()

	userRepo := repository.NewUserRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(redisClient)

	tokenManager := security.NewTokenManager(
		cfg.JWTAccessSecret,
		cfg.JWTRefreshSecret,
		cfg.AccessTTL,
		cfg.RefreshTTL,
	)

	authService := service.NewAuthService(
		userRepo,
		refreshTokenRepo,
		tokenManager,
	)

	authHandler := handler.NewAuthHandler(authService)

	router := gin.Default()

	registerRoutes(router, authHandler)

	return router.Run(":" + cfg.HTTPPort)
}
