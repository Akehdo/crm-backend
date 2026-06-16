package app_errors

import "errors"

var (
	ErrInvalidAccessToken = errors.New("invalid access token")
)
