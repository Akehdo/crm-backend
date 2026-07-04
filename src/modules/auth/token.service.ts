import { createHmac, randomBytes } from "crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { parseDurationToSeconds } from "../../config/configuration";

export type AccessTokenClaims = {
  role: string;
  userId: bigint;
};

@Injectable()
export class TokenService {
  readonly refreshTtlSeconds: number;
  private readonly accessSecret: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.accessSecret = this.config.get<string>("JWT_ACCESS_SECRET", "");
    this.refreshSecret = this.config.get<string>("JWT_REFRESH_SECRET", "");
    this.accessTtlSeconds = parseDurationToSeconds(
      this.config.get<string>("ACCESS_TTL", "15m"),
      15 * 60,
    );
    this.refreshTtlSeconds = parseDurationToSeconds(
      this.config.get<string>("REFRESH_TTL", "720h"),
      30 * 24 * 60 * 60,
    );

    if (!this.accessSecret || !this.refreshSecret) {
      throw new Error("jwt secrets must be configured");
    }
  }

  async generateAccessToken(userId: bigint, role: string): Promise<string> {
    return this.jwt.signAsync(
      { role },
      {
        algorithm: "HS256",
        expiresIn: this.accessTtlSeconds,
        secret: this.accessSecret,
        subject: userId.toString(),
      },
    );
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString("base64url");
  }

  hashRefreshToken(token: string): string {
    return createHmac("sha256", this.refreshSecret).update(token).digest("hex");
  }

  async parseAccessToken(token: string): Promise<AccessTokenClaims> {
    const payload = await this.jwt.verifyAsync<{ role?: string; sub?: string }>(
      token,
      {
        algorithms: ["HS256"],
        secret: this.accessSecret,
      },
    );

    if (
      !payload.sub ||
      !payload.role ||
      !["user", "admin"].includes(payload.role)
    ) {
      throw new Error("invalid token payload");
    }

    const userId = BigInt(payload.sub);
    if (userId <= 0n) {
      throw new Error("invalid token subject");
    }

    return {
      role: payload.role,
      userId,
    };
  }
}
