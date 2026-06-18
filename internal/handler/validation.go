package handler

import (
	"crm-backend/internal/handler/dto"
	"errors"
	"net/http"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

func ConfigureValidator() error {
	validate, ok := binding.Validator.Engine().(*validator.Validate)
	if !ok {
		return errors.New("unexpected validator engine")
	}

	validate.RegisterTagNameFunc(func(field reflect.StructField) string {
		jsonName := strings.SplitN(field.Tag.Get("json"), ",", 2)[0]

		switch jsonName {
		case "-":
			return ""
		case "":
			return field.Name
		default:
			return jsonName
		}
	})

	return nil
}

func writeValidationError(c *gin.Context, err error) {
	validationErrors, ok := errors.AsType[validator.ValidationErrors](err)
	if !ok {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "invalid JSON body",
		})
		return
	}

	fields := make(map[string]string, len(validationErrors))

	for _, validationError := range validationErrors {
		fields[validationError.Field()] =
			validationErrorMessage(validationError)
	}

	c.JSON(http.StatusBadRequest, dto.ValidationErrorResponse{
		Error:  "validation failed",
		Fields: fields,
	})
}

func validationErrorMessage(validationError validator.FieldError) string {
	switch validationError.Tag() {
	case "required":
		return "field is required"
	case "email":
		return "must be a valid email"

	case "min":
		return "must contain at least " +
			validationError.Param() +
			" characters"

	case "max":
		return "must contain no more than " +
			validationError.Param() +
			" characters"

	default:
		return "invalid value"
	}
}

func bindJSON(c *gin.Context, request any) bool {
	if err := c.ShouldBindJSON(request); err != nil {
		writeValidationError(c, err)
		return false
	}
	return true
}
