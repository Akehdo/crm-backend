package repository

import (
	"context"
	"crm-backend/internal/app_errors"
	"crm-backend/internal/domain"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type RecordRepository interface {
	Create(ctx context.Context, record *domain.Record) error
}

type recordRepository struct {
	db *gorm.DB
}

func NewRecordRepository(db *gorm.DB) RecordRepository {
	return &recordRepository{db: db}
}

func (r *recordRepository) Create(ctx context.Context, record *domain.Record) error {
	err := r.db.WithContext(ctx).
		Create(record).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return app_errors.ErrRecordAlreadyExists
		}

		return fmt.Errorf("create record: %w", err)
	}

	return nil
}
