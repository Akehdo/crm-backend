package domain

import "time"

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

type User struct {
	ID uint `gorm:"primary_key"`

	Email        string `gorm:"size:255;not null;uniqueIndex"`
	PasswordHash string `gorm:"size:255;not null"`

	Role Role `gorm:"type:varchar(20);not null"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
