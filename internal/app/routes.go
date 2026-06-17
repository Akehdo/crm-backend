package app

import (
	"crm-backend/internal/handler"
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
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", authHandler.Logout)
	}
}
