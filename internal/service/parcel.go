package service

import (
	"context"
	"crm-backend/internal/domain"
	"crm-backend/internal/repository"
	"errors"
	"fmt"
	"strings"
	"time"
)

type ParcelService interface {
	Create(ctx context.Context, trackNumbers []string) error
	UpsertStatus(
		ctx context.Context,
		trackNumbers []string,
		status domain.Status,
	) error
}

type parcelService struct {
	repo repository.ParcelRepository
}

func NewParcelService(repo repository.ParcelRepository) ParcelService {
	return &parcelService{repo: repo}
}

func (s *parcelService) Create(ctx context.Context, trackNumbers []string) error {
	if len(trackNumbers) == 0 {
		return errors.New("track numbers are required")
	}

	parcels := make([]domain.Parcel, 0, len(trackNumbers))

	for _, trackNumber := range trackNumbers {
		trackNumber := strings.TrimSpace(trackNumber)
		if trackNumber == "" {
			continue
		}

		parcels = append(parcels, domain.Parcel{
			TrackNumber: trackNumber,
			Status:      domain.AddedInDB,
		})
	}

	if err := s.repo.CreateOneOrMany(ctx, parcels); err != nil {
		return fmt.Errorf("create parcels %w", err)
	}

	return nil
}

func (s *parcelService) UpsertStatus(
	ctx context.Context,
	trackNumbers []string,
	status domain.Status,
) error {
	trackNumbers = normalizeTrackNumbers(trackNumbers)
	if len(trackNumbers) == 0 {
		return errors.New("track numbers are required")
	}

	now := time.Now()

	parcels := make([]domain.Parcel, 0, len(trackNumbers))

	for _, trackNumber := range trackNumbers {
		parcels = append(parcels, domain.Parcel{
			TrackNumber: trackNumber,
			Status:      status,
			UpdatedAt:   now,
		})
	}

	return s.repo.UpsertStatus(ctx, parcels)
}

func normalizeTrackNumbers(trackNumbers []string) []string {
	seen := make(map[string]struct{})
	result := make([]string, 0, len(trackNumbers))

	for _, trackNumber := range trackNumbers {
		trackNumber = strings.TrimSpace(trackNumber)

		if trackNumber == "" {
			continue
		}

		if _, exists := seen[trackNumber]; exists {
			continue
		}

		seen[trackNumber] = struct{}{}
		result = append(result, trackNumber)
	}

	return result
}
