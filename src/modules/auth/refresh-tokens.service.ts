import { Injectable } from "@nestjs/common";

import { RedisService } from "../../redis/redis.service";
import { InvalidRefreshTokenException } from "./exceptions/invalid-refresh-token.exception";

@Injectable()
export class RefreshTokensService {
  constructor(private readonly redis: RedisService) {}

  async consume(tokenHash: string): Promise<string> {
    const value = await this.redis
      .getClient()
      .call("GETDEL", this.key(tokenHash));

    if (typeof value !== "string") {
      throw new InvalidRefreshTokenException();
    }

    return value;
  }

  async delete(tokenHash: string): Promise<void> {
    await this.redis.getClient().del(this.key(tokenHash));
  }

  async save(
    tokenHash: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis
      .getClient()
      .set(this.key(tokenHash), userId, "EX", ttlSeconds);
  }

  private key(tokenHash: string): string {
    return `auth:refresh:${tokenHash}`;
  }
}
