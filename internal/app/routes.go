package app

import (
	"crm-backend/internal/handler"
	"crm-backend/internal/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func registerRoutes(router *gin.Engine, authHandler *handler.AuthHandler) {
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
}
