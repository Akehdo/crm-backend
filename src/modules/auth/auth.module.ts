import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { RefreshTokensService } from "./refresh-tokens.service";
import { TokenService } from "./token.service";

@Module({
  controllers: [AuthController],
  exports: [AccessTokenGuard, TokenService],
  imports: [JwtModule.register({}), UsersModule],
  providers: [
    AccessTokenGuard,
    AuthService,
    RefreshTokensService,
    TokenService,
  ],
})
export class AuthModule {}
