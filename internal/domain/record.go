package domain

import "time"

type PaymentType string

var (
	KaspiQR PaymentType = "kaspiQR"
	Card    PaymentType = "card"
	Cash    PaymentType = "cash"
)

type Record struct {
	ID         uint `gorm:"primaryKey"`
	ClientCode uint

	TrackNumbers []string

	Weight float64
	Price  float64

	PaymentType PaymentType `gorm:"type:varchar(20);not null"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
