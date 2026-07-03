package service

import (
	"context"
	"crm-backend/internal/app_errors"
	"crm-backend/internal/domain"
	"crm-backend/internal/repository"
	"fmt"
)

type RecordService interface {
	Create(ctx context.Context, record *domain.Record) error
}

type recordService struct {
	repo repository.RecordRepository
}

func NewRecordService(repo repository.RecordRepository) RecordService {
	return &recordService{repo: repo}
}

func (s *recordService) Create(ctx context.Context, record *domain.Record) error {
	if record == nil {
		return fmt.Errorf("%w: record is required", app_errors.ErrInvalidRecord)
	}

	if record.ClientCode == 0 {
		return fmt.Errorf("%w: client code is required", app_errors.ErrInvalidRecord)
	}

	record.TrackNumbers = normalizeTrackNumbers(record.TrackNumbers)
	if len(record.TrackNumbers) == 0 {
		return fmt.Errorf("%w: track numbers are required", app_errors.ErrInvalidRecord)
	}

	if record.Price <= 0 || record.Weight <= 0 {
		return fmt.Errorf("%w: price and weight must be positive", app_errors.ErrInvalidRecord)
	}

	if !isValidPaymentType(record.PaymentType) {
		return fmt.Errorf("%w: invalid payment type", app_errors.ErrInvalidRecord)
	}

	if err := s.repo.Create(ctx, record); err != nil {
		return fmt.Errorf("create record: %w", err)
	}

	return nil
}

func isValidPaymentType(paymentType domain.PaymentType) bool {
	switch paymentType {
	case domain.KaspiQR, domain.Card, domain.Cash:
		return true
	default:
		return false
	}
}
