import { Injectable } from "@nestjs/common";

import { RedisService } from "../../redis/redis.service";
import { InvalidRefreshTokenException } from "./exceptions/invalid-refresh-token.exception";

@Injectable()
export class RefreshTokensService {
  constructor(private readonly redis: RedisService) {}

  async consume(tokenHash: string): Promise<string> {
    // Use GETDEL so a refresh token is valid only once.
    const key = `auth:refresh:${tokenHash}`;
    const value = await this.redis.getClient().call("GETDEL", key);

    if (typeof value !== "string") {
      throw new InvalidRefreshTokenException();
    }

    return value;
  }

  async delete(tokenHash: string): Promise<number> {
    const key = `auth:refresh:${tokenHash}`;
    return this.redis.getClient().del(key);
  }

  async save(
    tokenHash: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    // Store only the hashed token and let Redis expire it automatically.
    const key = `auth:refresh:${tokenHash}`;
    const result = await this.redis
      .getClient()
      .set(key, userId, "EX", ttlSeconds);

    return result === "OK";
  }
}
