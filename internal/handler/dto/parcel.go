package dto

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
