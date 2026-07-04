import { Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";

import { UsersService } from "../users/users.service";
import { UserAlreadyExistsException } from "../users/exceptions/user-already-exists.exception";
import { UserNotFoundException } from "../users/exceptions/user-not-found.exception";
import { InvalidCredentialsException } from "./exceptions/invalid-credentials.exception";
import { InvalidRefreshTokenException } from "./exceptions/invalid-refresh-token.exception";
import { RefreshTokensService } from "./refresh-tokens.service";
import { TokenService } from "./token.service";

type TokenPair = {
  access_token: string;
  refresh_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly refreshTokens: RefreshTokensService,
    private readonly tokenService: TokenService,
    private readonly users: UsersService,
  ) {}

  async login(email: string, password: string): Promise<TokenPair> {
    const normalizedEmail = normalizeEmail(email);

    try {
      const user = await this.users.findByEmail(normalizedEmail);
      const passwordMatches = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatches) {
        throw new InvalidCredentialsException();
      }

      return this.issueTokens(user.id, user.role);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new InvalidCredentialsException();
      }

      throw error;
    }
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.refreshTokens.delete(
      this.tokenService.hashRefreshToken(refreshToken),
    );
  }

  async refresh(oldRefreshToken: string): Promise<TokenPair> {
    if (!oldRefreshToken) {
      throw new InvalidRefreshTokenException();
    }

    const oldTokenHash = this.tokenService.hashRefreshToken(oldRefreshToken);
    const userId = await this.refreshTokens.consume(oldTokenHash);

    try {
      const user = await this.users.findById(userId);
      return this.issueTokens(user.id, user.role);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new InvalidRefreshTokenException();
      }

      throw error;
    }
  }

  async register(email: string, password: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);

    if (await this.users.existsByEmail(normalizedEmail)) {
      throw new UserAlreadyExistsException();
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.users.create(normalizedEmail, passwordHash, "user");
  }

  private async issueTokens(userId: bigint, role: string): Promise<TokenPair> {
    const accessToken = await this.tokenService.generateAccessToken(
      userId,
      role,
    );
    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);

    await this.refreshTokens.save(
      refreshTokenHash,
      userId,
      this.tokenService.refreshTtlSeconds,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
