package domain

import "time"

type Status string

var (
	AddedInDB      Status = "added"
	Shipped        Status = "shipped"
	ArrivedInAlm   Status = "almaty"
	ArrivedInKoksh Status = "koksh"
)

type Parcel struct {
	ID          uint   `gorm:"primary_key"`
	TrackNumber string `gorm:"size:255;not null"`

	Status Status `gorm:"type:varchar(20);not null"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
