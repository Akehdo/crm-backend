package domain

import "time"

type PaymentType string

const (
	KaspiQR PaymentType = "kaspiQR"
	Card    PaymentType = "card"
	Cash    PaymentType = "cash"
)

type Record struct {
	ID         uint `gorm:"primaryKey"`
	ClientCode uint `gorm:"not null"`

	TrackNumbers []string `gorm:"type:jsonb;serializer:json;not null"`

	Weight float64
	Price  float64

	PaymentType PaymentType `gorm:"type:varchar(20);not null"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
