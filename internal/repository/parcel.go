package repository

import (
	"context"
	"crm-backend/internal/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ParcelRepository interface {
	CreateOneOrMany(ctx context.Context, parcels []domain.Parcel) error
	UpsertStatus(ctx context.Context, parcels []domain.Parcel) error
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

func (r *parcelRepository) UpsertStatus(ctx context.Context, parcels []domain.Parcel) error {
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "track_number"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"status",
				"updated_at",
			}),
		}).
		Create(&parcels).
		Error
}
