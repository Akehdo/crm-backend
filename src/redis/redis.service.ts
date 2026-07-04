import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService) {
    const { host, port } = parseRedisAddress(
      config.get<string>("REDIS_ADDR", "localhost:6379"),
    );

    this.client = new Redis({
      db: Number(config.get<string>("REDIS_DB", "0")),
      host,
      password: config.get<string>("REDIS_PASSWORD") || undefined,
      port,
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}

function parseRedisAddress(address: string): { host: string; port: number } {
  const [host, port] = address.split(":");
  return {
    host: host || "localhost",
    port: Number(port || 6379),
  };
}
