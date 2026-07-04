import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { TokenService } from "../token.service";

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: {
    role: string;
    userId: string;
  };
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headerValue = request.headers.authorization;
    const header = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!header) {
      throw this.unauthorized("authorization header is required");
    }

    const [scheme, token] = header.split(/\s+/);
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw this.unauthorized(
        "authorization header must be in format: Bearer <token>",
      );
    }

    try {
      request.user = await this.tokenService.parseAccessToken(token);
      return true;
    } catch {
      throw this.unauthorized("invalid or expired access token");
    }
  }

  private unauthorized(message: string): UnauthorizedException {
    return new UnauthorizedException(message);
  }
}
