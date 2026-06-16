package app_errors

import "errors"

var (
	ErrRefreshTokenNotFound = errors.New("refresh token not found")
)
