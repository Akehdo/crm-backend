import { Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";

import { UsersService } from "../users/users.service";
import { UserNotFoundException } from "../users/exceptions/user-not-found.exception";
import { InvalidCredentialsException } from "./exceptions/invalid-credentials.exception";
import { InvalidRefreshTokenException } from "./exceptions/invalid-refresh-token.exception";
import { RefreshTokensService } from "./refresh-tokens.service";
import { TokenService } from "./token.service";
import { TokenPair } from "./types/auth-types";

@Injectable()
export class AuthService {
  constructor(
    private readonly refreshTokens: RefreshTokensService,
    private readonly tokenService: TokenService,
    private readonly users: UsersService,
  ) {}

  async login(email: string, password: string): Promise<TokenPair> {
    // Normalize email at the service boundary before looking up the user.
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const user = await this.users.findByEmail(normalizedEmail);
      const passwordMatches = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatches) {
        throw new InvalidCredentialsException();
      }

      // Issue a short-lived access token and persist the refresh token hash.
      const accessToken = await this.tokenService.generateAccessToken(
        user.id,
        user.role,
      );
      const refreshToken = this.tokenService.generateRefreshToken();
      const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);

      await this.refreshTokens.save(
        refreshTokenHash,
        user.id,
        this.tokenService.refreshTtlSeconds,
      );

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new InvalidCredentialsException();
      }

      throw error;
    }
  }

  async logout(refreshToken: string): Promise<boolean> {
    if (!refreshToken) {
      return false;
    }

    const deletedCount = await this.refreshTokens.delete(
      this.tokenService.hashRefreshToken(refreshToken),
    );

    return deletedCount > 0;
  }

  async refresh(oldRefreshToken: string): Promise<TokenPair> {
    if (!oldRefreshToken) {
      throw new InvalidRefreshTokenException();
    }

    // Consume the old refresh token first so it cannot be reused.
    const oldTokenHash = this.tokenService.hashRefreshToken(oldRefreshToken);
    const userId = await this.refreshTokens.consume(oldTokenHash);

    try {
      const user = await this.users.findById(userId);

      // Issue a replacement pair and save only the hashed refresh token.
      const accessToken = await this.tokenService.generateAccessToken(
        user.id,
        user.role,
      );
      const refreshToken = this.tokenService.generateRefreshToken();
      const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);

      await this.refreshTokens.save(
        refreshTokenHash,
        user.id,
        this.tokenService.refreshTtlSeconds,
      );

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new InvalidRefreshTokenException();
      }

      throw error;
    }
  }
}
