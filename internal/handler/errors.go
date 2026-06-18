package handler

import (
	"log/slog"
	"net/http"

	"crm-backend/internal/handler/dto"

	"github.com/gin-gonic/gin"
)

const (
	errorCodeInvalidRequest      = "INVALID_REQUEST"
	errorCodeValidationFailed    = "VALIDATION_FAILED"
	errorCodeInvalidCredentials  = "INVALID_CREDENTIALS"
	errorCodeUserAlreadyExists   = "USER_ALREADY_EXISTS"
	errorCodeInvalidRefreshToken = "INVALID_REFRESH_TOKEN"
	errorCodeInternal            = "INTERNAL_ERROR"
)

func writeError(
	c *gin.Context,
	status int,
	code string,
	message string,
) {
	c.JSON(status, dto.ErrorResponse{
		Error: dto.ErrorDetails{
			Code:    code,
			Message: message,
		},
	})
}

func writeFieldErrors(c *gin.Context, fields map[string]string) {
	c.JSON(http.StatusBadRequest, dto.ErrorResponse{
		Error: dto.ErrorDetails{
			Code:    errorCodeValidationFailed,
			Message: "request validation failed",
			Fields:  fields,
		},
	})
}

func writeInternalError(c *gin.Context, operation string, err error) {
	slog.ErrorContext(
		c.Request.Context(),
		operation,
		"error", err,
		"method", c.Request.Method,
		"path", c.Request.URL.Path,
	)

	writeError(
		c,
		http.StatusInternalServerError,
		errorCodeInternal,
		"internal server error",
	)
}
