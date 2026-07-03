package dto

type PaymentType string

const (
	KaspiQR PaymentType = "kaspiQR"
	Card    PaymentType = "card"
	Cash    PaymentType = "cash"
)

type CreateRecordRequest struct {
	ClientCode   uint        `json:"client_code" binding:"required"`
	TrackNumbers []string    `json:"track_numbers" binding:"required,min=1,dive,required"`
	Weight       float64     `json:"weight" binding:"required,gt=0"`
	Price        float64     `json:"price" binding:"required,gt=0"`
	PaymentType  PaymentType `json:"payment_type" binding:"required,oneof=kaspiQR card cash"`
}
