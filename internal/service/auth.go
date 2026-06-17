package service

import (
	"context"
	"crm-backend/internal/app_errors"
	"crm-backend/internal/domain"
	"crm-backend/internal/repository"
	"crm-backend/internal/security"
	
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(ctx context.Context, email string, password string) error
	Login(ctx context.Context, email string, password string) (*AuthTokens, error)
	Refresh(ctx context.Context, refreshToken string) (*AuthTokens, error)
	Logout(ctx context.Context, refreshToken string) error
}

type AuthTokens struct {
	AccessToken  string
	RefreshToken string
}

type authService struct {
	userRepo     repository.UserRepository
	refTokenRepo repository.RefreshTokenRepository
	tokenManager *security.TokenManager
}

func NewAuthService(
	userRepo repository.UserRepository,
	refTokenRepo repository.RefreshTokenRepository,
	tokenManager *security.TokenManager,
) AuthService {
	return &authService{
		userRepo:     userRepo,
		refTokenRepo: refTokenRepo,
		tokenManager: tokenManager,
	}
}

func (s *authService) Register(ctx context.Context, email string, password string) error {
	exists, err := s.userRepo.ExistsByEmail(ctx, email)
	if err != nil {
		return err
	}

	if exists {
		return app_errors.ErrUserAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}

	user := domain.User{
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         domain.RoleUser,
	}

	if err := s.userRepo.Create(ctx, &user); err != nil {
		return err
	}

	return nil

}
func (s *authService) Login(ctx context.Context, email string, password string) (*AuthTokens, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, app_errors.ErrInvalidCredentials
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, app_errors.ErrInvalidCredentials
	}

	accessToken, err := s.tokenManager.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.tokenManager.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	hashedToken := s.tokenManager.HashRefreshToken(refreshToken)

	if err := s.refTokenRepo.Save(ctx, hashedToken, user.ID, s.tokenManager.RefreshTTL()); err != nil {
		return nil, err
	}

	return &AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil

}

func (s *authService) Refresh(ctx context.Context, oldRefreshToken string) (*AuthTokens, error) {
	if oldRefreshToken == "" {
		return nil, app_errors.ErrInvalidCredentials
	}

	hashedOldToken := s.tokenManager.HashRefreshToken(oldRefreshToken)

	userID, err := s.refTokenRepo.GetUserId(ctx, hashedOldToken)
	if err != nil {
		return nil, app_errors.ErrInvalidCredentials
	}

	if err = s.refTokenRepo.Delete(ctx, hashedOldToken); err != nil {
		return nil, err
	}

	user, err := s.userRepo.FindById(ctx, userID)
	if err != nil {
		return nil, err
	}

	newAccessToken, err := s.tokenManager.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := s.tokenManager.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	hashedNewToken := s.tokenManager.HashRefreshToken(newRefreshToken)

	if err := s.refTokenRepo.Save(ctx, hashedNewToken, userID, s.tokenManager.RefreshTTL()); err != nil {
		return nil, err
	}

	return &AuthTokens{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil

}
func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return nil
	}

	hashedToken := s.tokenManager.HashRefreshToken(refreshToken)

	if err := s.refTokenRepo.Delete(ctx, hashedToken); err != nil {
		return err
	}

	return nil
}
