package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"crm-backend/internal/app_errors"

	"github.com/redis/go-redis/v9"
)

type RefreshTokenRepository interface {
	Save(ctx context.Context, tokenHash string, userID uint, duration time.Duration) error
	GetUserID(ctx context.Context, tokenHash string) (uint, error)
	Delete(ctx context.Context, tokenHash string) error
}

type redisRefreshTokenRepository struct {
	client *redis.Client
}

func NewRefreshTokenRepository(client *redis.Client) RefreshTokenRepository {
	return &redisRefreshTokenRepository{
		client: client,
	}
}

func (r *redisRefreshTokenRepository) Save(
	ctx context.Context, tokenHash string, userID uint, duration time.Duration,
) error {
	key := r.key(tokenHash)

	if err := r.client.Set(ctx, key, userID, duration).Err(); err != nil {
		return fmt.Errorf("save refresh token: %w", err)
	}

	return nil
}

func (r *redisRefreshTokenRepository) GetUserID(
	ctx context.Context,
	tokenHash string,
) (uint, error) {
	key := r.key(tokenHash)

	value, err := r.client.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return 0, app_errors.ErrRefreshTokenNotFound
	}

	if err != nil {
		return 0, fmt.Errorf("get refresh token: %w", err)
	}

	userID64, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("parse refresh token user id: %w", err)
	}

	return uint(userID64), nil
}

func (r *redisRefreshTokenRepository) Delete(ctx context.Context, tokenHash string) error {
	key := r.key(tokenHash)

	if err := r.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("delete refresh token: %w", err)
	}

	return nil
}

func (r *redisRefreshTokenRepository) key(tokenHash string) string {
	return "auth:refresh:" + tokenHash
}
