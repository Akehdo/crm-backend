package app

import (
	"crm-backend/internal/adapters"
	"crm-backend/internal/config"
	"crm-backend/internal/domain"
	"crm-backend/internal/handler"
	"crm-backend/internal/repository"
	"crm-backend/internal/security"
	"crm-backend/internal/service"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func Run() error {
	_ = godotenv.Load()

	if err := handler.ConfigureValidator(); err != nil {
		return fmt.Errorf("configure validator: %w", err)
	}

	cfg := config.Load()

	if cfg.JWTAccessSecret == "" || cfg.JWTRefreshSecret == "" {
		return fmt.Errorf("jwt secrets must be configured")
	}

	db, err := adapters.ConnectDatabase(cfg.DatabaseDSN())
	if err != nil {
		return err
	}

	if err := db.AutoMigrate(&domain.User{}, &domain.Parcel{}); err != nil {
		return fmt.Errorf("migrate adapters: %w", err)
	}

	redisClient, err := adapters.NewRedisClient(
		cfg.RedisAddr,
		cfg.RedisPassword,
		cfg.RedisDB,
	)
	if err != nil {
		return fmt.Errorf("connect redis: %w", err)
	}

	defer func() {
		if err := redisClient.Close(); err != nil {
			log.Printf("close redis client: %v", err)
		}
	}()

	userRepo := repository.NewUserRepository(db)
	parcelRepo := repository.NewParcelRepository(db)
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
	parcelService := service.NewParcelService(parcelRepo)

	authHandler := handler.NewAuthHandler(authService)
	parcelHandler := handler.NewParcelHandler(parcelService)

	router := gin.Default()

	registerRoutes(router, authHandler, parcelHandler, tokenManager)

	return router.Run(":" + cfg.HTTPPort)
}
