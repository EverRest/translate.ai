import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

export class GetUsageAnalyticsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId?: string,
    public readonly from?: Date,
    public readonly to?: Date,
  ) {}
}

export class GetUsageSummaryQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId?: string,
    public readonly from?: Date,
    public readonly to?: Date,
  ) {}
}

@Injectable()
export class UsageAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(query: GetUsageAnalyticsQuery) {
    const where = this.buildWhere(query);

    const items = await this.prisma.aiUsageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return items.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      jobId: row.jobId,
      jobItemId: row.jobItemId,
      provider: row.provider,
      model: row.model,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      estimatedCostUsd: Number(row.estimatedCostUsd),
      usedFallback: row.usedFallback,
      primaryProvider: row.primaryProvider,
      createdAt: row.createdAt,
    }));
  }

  async getSummary(query: GetUsageSummaryQuery) {
    const where = this.buildWhere(query);

    const rows = await this.prisma.aiUsageLog.groupBy({
      by: ['provider'],
      where,
      _sum: {
        inputTokens: true,
        outputTokens: true,
        estimatedCostUsd: true,
      },
      _count: { id: true },
    });

    const fallbackCount = await this.prisma.aiUsageLog.count({
      where: { ...where, usedFallback: true },
    });

    const totalCost = rows.reduce(
      (sum, row) => sum + Number(row._sum.estimatedCostUsd ?? 0),
      0,
    );

    return {
      totalRequests: rows.reduce((sum, row) => sum + row._count.id, 0),
      totalCostUsd: totalCost,
      fallbackCount,
      byProvider: rows.map((row) => ({
        provider: row.provider,
        requests: row._count.id,
        inputTokens: row._sum.inputTokens ?? 0,
        outputTokens: row._sum.outputTokens ?? 0,
        estimatedCostUsd: Number(row._sum.estimatedCostUsd ?? 0),
      })),
    };
  }

  private buildWhere(
    query: GetUsageAnalyticsQuery | GetUsageSummaryQuery,
  ): Prisma.AiUsageLogWhereInput {
    return {
      tenantId: query.tenantId,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };
  }
}
