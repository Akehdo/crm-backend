package repository

import (
	"context"
	"errors"
	"fmt"

	"crm-backend/internal/app_errors"
	"crm-backend/internal/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ParcelRepository interface {
	CreateOneOrMany(ctx context.Context, parcels []domain.Parcel) error
	GetByTrackNumber(ctx context.Context, trackNumber string) (*domain.Parcel, error)
	List(ctx context.Context, status *domain.Status, limit, offset int) ([]domain.Parcel, int64, error)
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

func (r *parcelRepository) GetByTrackNumber(ctx context.Context, trackNumber string) (*domain.Parcel, error) {
	var parcel domain.Parcel

	err := r.db.WithContext(ctx).
		Where("track_number = ?", trackNumber).
		First(&parcel).
		Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, app_errors.ErrParcelNotFound
		}

		return nil, fmt.Errorf("get parcel by track number: %w", err)
	}

	return &parcel, nil
}

func (r *parcelRepository) List(
	ctx context.Context,
	status *domain.Status,
	limit, offset int,
) ([]domain.Parcel, int64, error) {
	query := r.db.WithContext(ctx).Model(&domain.Parcel{})
	if status != nil {
		query = query.Where("status = ?", *status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var parcels []domain.Parcel
	err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&parcels).
		Error

	if err != nil {
		return nil, 0, err
	}

	return parcels, total, nil
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
