import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import type { AuthUser } from '../auth/auth-user.interface';
import { ApiTrafficService } from './api-traffic.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metrics: MetricsService,
    private readonly traffic: ApiTrafficService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (request.path === '/metrics') {
      return next.handle();
    }

    const started = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.record(request, context, started),
        error: () => this.record(request, context, started, 500),
      }),
    );
  }

  private record(
    request: Request,
    context: ExecutionContext,
    started: bigint,
    fallbackStatus = 200,
  ): void {
    const response = context.switchToHttp().getResponse<Response>();
    const durationSeconds =
      Number(process.hrtime.bigint() - started) / 1_000_000_000;

    this.metrics.recordHttpRequest(
      request.method,
      normalizeRoute(request),
      response.statusCode || fallbackStatus,
      durationSeconds,
    );

    const durationMs = Math.round(durationSeconds * 1000);
    const user = request.user as AuthUser | undefined;

    this.traffic.logRequest({
      tenantId: user?.tenantId,
      method: request.method,
      route: normalizeRoute(request),
      status: response.statusCode || fallbackStatus,
      durationMs,
    });
  }
}

function normalizeRoute(request: Request): string {
  const route = request.route as { path?: string } | undefined;
  const routePath = route?.path;
  if (typeof routePath === 'string') {
    return routePath.replace(/\/+/g, '/');
  }

  return request.path
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    )
    .replace(/\/\d+/g, '/:id');
}
