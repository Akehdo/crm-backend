package dto

import (
	"time"

	"crm-backend/pkg/pagination"
)

type ParcelStatus string

const (
	ParcelStatusAdded   ParcelStatus = "added"
	ParcelStatusShipped ParcelStatus = "shipped"
	ParcelStatusAlmaty  ParcelStatus = "almaty"
	ParcelStatusKoksh   ParcelStatus = "koksh"
)

type CreateParcelsRequest struct {
	TrackNumbers []string `json:"track_numbers" binding:"required,min=1,dive,required"`
}

type UpsertParcelsStatusRequest struct {
	TrackNumbers []string     `json:"track_numbers" binding:"required,min=1,dive,required"`
	Status       ParcelStatus `json:"status" binding:"required,oneof=added shipped almaty koksh"`
}

type ListParcelsRequest struct {
	Status ParcelStatus `form:"status" binding:"omitempty,oneof=added shipped almaty koksh"`
	Page   int          `form:"page" binding:"omitempty,min=1"`
	Limit  int          `form:"limit" binding:"omitempty,min=1,max=100"`
}

type ParcelResponse struct {
	ID          uint         `json:"id"`
	TrackNumber string       `json:"track_number"`
	Status      ParcelStatus `json:"status"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type ListParcelsResponse struct {
	Items []ParcelResponse `json:"items"`
	Meta  pagination.Meta  `json:"meta"`
}
