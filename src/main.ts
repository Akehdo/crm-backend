import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { AppModule } from "./app.module";
import { getCorsOrigins } from "./config/configuration";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 64 * 1024 }),
  );
  const config = app.get(ConfigService);

  app.enableCors({
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    origin: getCorsOrigins(config.get<string>("CORS_ALLOWED_ORIGINS")),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );

  const port = config.get<string>("HTTP_PORT", "8080");
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
