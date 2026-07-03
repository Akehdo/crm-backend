package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"crm-backend/internal/app_errors"
	"crm-backend/internal/handler/dto"

	"github.com/gin-gonic/gin"
)

const (
	errorCodeInvalidRequest      = "INVALID_REQUEST"
	errorCodeValidationFailed    = "VALIDATION_FAILED"
	errorCodeInvalidCredentials  = "INVALID_CREDENTIALS"
	errorCodeUserAlreadyExists   = "USER_ALREADY_EXISTS"
	errorCodeUserNotFound        = "USER_NOT_FOUND"
	errorCodeParcelNotFound      = "PARCEL_NOT_FOUND"
	errorCodeRecordAlreadyExists = "RECORD_ALREADY_EXISTS"
	errorCodeRecordNotFound      = "RECORD_NOT_FOUND"
	errorCodeInvalidRefreshToken = "INVALID_REFRESH_TOKEN"
	errorCodeInternal            = "INTERNAL_ERROR"
	errorCodeRequestTooLarge     = "REQUEST_TOO_LARGE"
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

func writeAppError(c *gin.Context, operation string, err error) {
	switch {
	case errors.Is(err, app_errors.ErrInvalidCredentials):
		writeError(
			c,
			http.StatusUnauthorized,
			errorCodeInvalidCredentials,
			"invalid email or password",
		)

	case errors.Is(err, app_errors.ErrInvalidRefreshToken):
		writeError(
			c,
			http.StatusUnauthorized,
			errorCodeInvalidRefreshToken,
			"invalid refresh token",
		)

	case errors.Is(err, app_errors.ErrUserAlreadyExists):
		writeError(
			c,
			http.StatusConflict,
			errorCodeUserAlreadyExists,
			"user already exists",
		)

	case errors.Is(err, app_errors.ErrUserNotFound):
		writeError(
			c,
			http.StatusNotFound,
			errorCodeUserNotFound,
			"user not found",
		)

	case errors.Is(err, app_errors.ErrParcelNotFound):
		writeError(
			c,
			http.StatusNotFound,
			errorCodeParcelNotFound,
			"parcel not found",
		)

	case errors.Is(err, app_errors.ErrInvalidRecord):
		writeError(
			c,
			http.StatusBadRequest,
			errorCodeInvalidRequest,
			"invalid record",
		)

	case errors.Is(err, app_errors.ErrRecordAlreadyExists):
		writeError(
			c,
			http.StatusConflict,
			errorCodeRecordAlreadyExists,
			"record already exists",
		)

	case errors.Is(err, app_errors.ErrRecordNotFound):
		writeError(
			c,
			http.StatusNotFound,
			errorCodeRecordNotFound,
			"record not found",
		)

	default:
		writeInternalError(c, operation, err)
	}
}
