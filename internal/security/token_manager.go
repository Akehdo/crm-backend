package security

import (
	"crm-backend/internal/domain"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenManager struct {
	accessSecret  string
	refreshSecret string
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

func NewTokenManager(accessSecret string, refreshSecret string, accessTTL time.Duration, refreshTTL time.Duration) *TokenManager {
	return &TokenManager{
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		accessTTL:     accessTTL,
		refreshTTL:    refreshTTL,
	}
}

func (m *TokenManager) GenerateAccessToken(userID uint, role domain.Role) (string, error) {
	claims := jwt.MapClaims{
		"sub":  strconv.FormatUint(uint64(userID), 10),
		"role": string(role),
		"exp":  time.Now().Add(m.accessTTL).Unix(),
		"iat":  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(m.accessSecret))
}

func (m *TokenManager) GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)

	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}

func (m *TokenManager) HashRefreshToken(token string) string {
	mac := hmac.New(sha256.New, []byte(m.refreshSecret))
	mac.Write([]byte(token))

	return hex.EncodeToString(mac.Sum(nil))
}

func (m *TokenManager) RefreshTTL() time.Duration {
	return m.refreshTTL
}
