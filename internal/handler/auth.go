package handler

import (
	"crm-backend/internal/app_errors"
	"crm-backend/internal/handler/dto"
	"crm-backend/internal/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest

	if !bindJSON(c, &req) {
		return
	}

	tokens, err := h.authService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error: "invalid credentials",
		})
		return
	}

	c.JSON(http.StatusOK, dto.LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest

	if !bindJSON(c, &req) {
		return
	}

	err := h.authService.Register(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, app_errors.ErrUserAlreadyExists) {
			c.JSON(http.StatusConflict, dto.ErrorResponse{
				Error: "user already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "internal server error",
		})
		return
	}

	c.JSON(http.StatusCreated, dto.MessageResponse{
		Message: "user registered successfully",
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var req dto.RefreshRequest

	if !bindJSON(c, &req) {
		return
	}

	if err := h.authService.Logout(c.Request.Context(), req.RefreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "internal server error",
		})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "logged out successfully",
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshRequest

	if !bindJSON(c, &req) {
		return
	}

	tokens, err := h.authService.Refresh(c.Request.Context(), req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error: "invalid refresh token",
		})
		return
	}

	c.JSON(http.StatusOK, dto.LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	})
}
