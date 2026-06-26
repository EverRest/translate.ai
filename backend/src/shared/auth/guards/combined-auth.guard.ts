import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyAuthService } from '../../../auth/infrastructure/api-key-auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

function extractBearerToken(request: {
  headers: { authorization?: string };
}): string | undefined {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }
  return header.slice('Bearer '.length).trim();
}

@Injectable()
export class CombinedAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeyAuth: ApiKeyAuthService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();
    const token = extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    if (token.startsWith('ta_live_')) {
      request.user = await this.apiKeyAuth.validate(token);
      return true;
    }

    const result = await super.canActivate(context);
    if (result) {
      const user = request.user as { authMethod?: string } | undefined;
      if (user && !user.authMethod) {
        user.authMethod = 'jwt';
      }
    }
    return result as boolean;
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Invalid or missing token');
    }
    return user;
  }
}
