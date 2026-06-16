package repository

import (
	"context"
	"crm-backend/internal/app_errors"
	"crm-backend/internal/domain"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	ExistsByEmail(ctx context.Context, email string) (bool, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{
		db: db,
	}
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User

	err := r.db.WithContext(ctx).
		Where("email = ?", email).
		First(&user).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, app_errors.ErrUserNotFound
		}

		return nil, fmt.Errorf(
			"find user by email: w%",
			err,
		)
	}

	return &user, nil
}

func (r *userRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var user *domain.User

	err := r.db.WithContext(ctx).
		Select("id").
		Where("email = ?", email).
		Take(&user).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}

		return false, fmt.Errorf(
			"check if user exists by email: w%",
			err,
		)
	}

	return true, nil
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	err := r.db.WithContext(ctx).
		Create(user).
		Error

	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}

	return nil
}
