package app_errors

import "errors"

var (
	ErrInvalidRecord       = errors.New("invalid record")
	ErrRecordAlreadyExists = errors.New("record already exists")
	ErrRecordNotFound      = errors.New("record not found")
)
