package repository

import (
	"context"
	"crm-backend/internal/domain"

	"gorm.io/gorm"
)

type ParcelRepository interface {
	CreateOneOrMany(ctx context.Context, parcels []domain.Parcel) error
	UpdateStatusOneOrMany(ctx context.Context, trackNumbers []string, status domain.Status) error
}

type parcelRepository struct {
	db *gorm.DB
}

func NewParcelRepository(db *gorm.DB) ParcelRepository {
	return &parcelRepository{db: db}
}

func (r *parcelRepository) CreateOneOrMany(ctx context.Context, parcels []domain.Parcel) error {
	return r.db.WithContext(ctx).Create(&parcels).Error
}

func (r *parcelRepository) UpdateStatusOneOrMany(ctx context.Context, trackNumbers []string, status domain.Status) error {

	return r.db.WithContext(ctx).
		Model(&domain.Parcel{}).
		Where("track_number IN ?", trackNumbers).
		Update("status", status).
		Error
}
