package middleware

import (
	"crm-backend/internal/security"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	UserIDContextKey = "userID"
	RoleContextKey   = "role"
)

func IsAuthenticated(tokenManager *security.TokenManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "authorization header is required",
			})
			return
		}

		parts := strings.Fields(authHeader)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "authorization header must be in format: Bearer <token>",
			})
			return
		}

		claims, err := tokenManager.ParseAccessToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired access token",
			})
			return
		}

		c.Set(UserIDContextKey, claims.UserID)
		c.Set(RoleContextKey, claims.Role)
		c.Next()
	}
}
