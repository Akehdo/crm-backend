package app

import (
	"crm-backend/internal/handler"
	"crm-backend/internal/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func registerRoutes(
	router *gin.Engine,
	authHandler *handler.AuthHandler,
	parcelHandler *handler.ParcelHandler,
) {
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	auth := router.Group("/auth")
	const authBodyLimit int64 = 16 * 1024
	auth.Use(middleware.BodyLimit(authBodyLimit))
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", authHandler.Logout)
	}

	parcels := router.Group("/parcels")
	const parcelsBodyLimit int64 = 64 * 1024
	parcels.Use(middleware.BodyLimit(parcelsBodyLimit))
	{
		parcels.POST("", parcelHandler.Create)
		parcels.PUT("/status", parcelHandler.UpsertStatus)
	}
}
