import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../auth-user.interface';
import { ALLOW_API_KEY } from '../decorators/allow-api-key.decorator';

@Injectable()
export class ApiKeyAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params?: { projectId?: string };
      body?: { projectId?: string };
      query?: { projectId?: string };
    }>();
    const user = request.user;

    if (!user || user.authMethod !== 'api_key' || !user.projectId) {
      return true;
    }

    const allowApiKey = this.reflector.getAllAndOverride<boolean>(
      ALLOW_API_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!allowApiKey) {
      throw new ForbiddenException(
        'This endpoint requires a dashboard session (JWT), not a project API key',
      );
    }

    const scopedProjectId =
      request.params?.projectId ??
      request.body?.projectId ??
      request.query?.projectId;

    if (scopedProjectId && scopedProjectId !== user.projectId) {
      throw new ForbiddenException(
        `API key is bound to project ${user.projectId} only`,
      );
    }

    return true;
  }
}
