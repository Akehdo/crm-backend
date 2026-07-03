package app_errors

import "errors"

var (
	ErrRecordAlreadyExists = errors.New("record already exists")
	ErrRecordNotFound      = errors.New("record not found")
)
