package repository

import (
	"context"
	"crm-backend/internal/app_errors"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

type RefreshTokenRepository interface {
	Save(ctx context.Context, tokenHash string, userId uint, duration time.Duration) error
	GetUserId(ctx context.Context, tokenHash string) (uint, error)
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
	ctx context.Context, tokenHash string, userId uint, duration time.Duration,
) error {
	key := r.key(tokenHash)

	return r.client.Set(ctx, key, userId, duration).Err()
}

func (r *redisRefreshTokenRepository) GetUserId(
	ctx context.Context,
	tokenHash string,
) (uint, error) {
	key := r.key(tokenHash)

	value, err := r.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return 0, app_errors.ErrRefreshTokenNotFound
	}

	if err != nil {
		return 0, err
	}

	userID64, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0, err
	}

	return uint(userID64), nil
}

func (r *redisRefreshTokenRepository) Delete(ctx context.Context, tokenHash string) error {
	key := r.key(tokenHash)

	return r.client.Del(ctx, key).Err()
}

func (r *redisRefreshTokenRepository) key(tokenHash string) string {
	return "auth:refresh:" + tokenHash
}
