import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type TrafficLogInput = {
  tenantId?: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
};

export class GetTrafficSummaryQuery {
  constructor(
    public readonly tenantId: string,
    public readonly hours = 24,
  ) {}
}

export class GetTrafficTimelineQuery {
  constructor(
    public readonly tenantId: string,
    public readonly hours = 24,
  ) {}
}

@Injectable()
export class ApiTrafficService {
  private readonly logger = new Logger(ApiTrafficService.name);

  constructor(private readonly prisma: PrismaService) {}

  logRequest(input: TrafficLogInput): void {
    void this.prisma.apiRequestLog
      .create({
        data: {
          tenantId: input.tenantId,
          method: input.method,
          route: input.route,
          status: input.status,
          durationMs: input.durationMs,
        },
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Failed to persist API traffic log: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
  }

  async getSummary(query: GetTrafficSummaryQuery) {
    const since = new Date(Date.now() - query.hours * 3_600_000);

    const where = {
      tenantId: query.tenantId,
      createdAt: { gte: since },
    };

    const [totalRequests, avgDuration, byRoute, byStatus, byMethod] =
      await Promise.all([
        this.prisma.apiRequestLog.count({ where }),
        this.prisma.apiRequestLog.aggregate({
          where,
          _avg: { durationMs: true },
        }),
        this.prisma.apiRequestLog.groupBy({
          by: ['route'],
          where,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 8,
        }),
        this.prisma.apiRequestLog.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
          orderBy: { status: 'asc' },
        }),
        this.prisma.apiRequestLog.groupBy({
          by: ['method'],
          where,
          _count: { id: true },
          orderBy: { method: 'asc' },
        }),
      ]);

    return {
      hours: query.hours,
      totalRequests,
      avgDurationMs: Math.round(avgDuration._avg.durationMs ?? 0),
      byRoute: byRoute.map((row) => ({
        route: row.route,
        requests: row._count.id,
      })),
      byStatus: byStatus.map((row) => ({
        status: row.status,
        requests: row._count.id,
      })),
      byMethod: byMethod.map((row) => ({
        method: row.method,
        requests: row._count.id,
      })),
    };
  }

  async getTimeline(query: GetTrafficTimelineQuery) {
    const since = new Date(Date.now() - query.hours * 3_600_000);
    const logs = await this.prisma.apiRequestLog.findMany({
      where: {
        tenantId: query.tenantId,
        createdAt: { gte: since },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const bucketMs = 3_600_000;
    const buckets = new Map<string, number>();

    for (const log of logs) {
      const bucketStart = new Date(
        Math.floor(log.createdAt.getTime() / bucketMs) * bucketMs,
      );
      const key = bucketStart.toISOString();
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const points = Array.from(buckets.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([timestamp, requests]) => ({ timestamp, requests }));

    return {
      hours: query.hours,
      points,
    };
  }
}
