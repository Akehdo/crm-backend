package domain

import "time"

type Status string

var (
	ParcelStatusAdded   Status = "added"
	ParcelStatusShipped Status = "shipped"
	ParcelStatusAlmaty  Status = "almaty"
	ParcelStatusKoksh   Status = "koksh"
)

type Parcel struct {
	ID          uint   `gorm:"primary_key"`
	TrackNumber string `gorm:"size:255;not null; uniqueIndex"`

	Status Status `gorm:"type:varchar(20);not null"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
