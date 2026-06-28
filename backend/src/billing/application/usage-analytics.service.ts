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

export class GetUsageTimelineQuery {
  constructor(
    public readonly tenantId: string,
    public readonly days?: number,
    public readonly projectId?: string,
  ) {}
}

export class GetAccountUsageQuery {
  constructor(public readonly tenantId: string) {}
}

type UsageWhereInput = Prisma.AiUsageLogWhereInput;

@Injectable()
export class UsageAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(query: GetUsageAnalyticsQuery) {
    const where = this.buildWhere(query);

    const items = await this.prisma.aiUsageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    return items.map((row) => ({
      id: row.id,
      userId: row.userId,
      userEmail: row.user?.email ?? null,
      projectId: row.projectId,
      jobId: row.jobId,
      jobItemId: row.jobItemId,
      provider: row.provider,
      model: row.model,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      totalTokens: row.inputTokens + row.outputTokens,
      estimatedCostUsd: Number(row.estimatedCostUsd),
      usedFallback: row.usedFallback,
      primaryProvider: row.primaryProvider,
      createdAt: row.createdAt,
    }));
  }

  async getSummary(query: GetUsageSummaryQuery) {
    const where = this.buildWhere(query);

    const [byProvider, byModel, byUserRows, fallbackCount, totals] =
      await Promise.all([
        this.prisma.aiUsageLog.groupBy({
          by: ['provider'],
          where,
          _sum: {
            inputTokens: true,
            outputTokens: true,
            estimatedCostUsd: true,
          },
          _count: { id: true },
        }),
        this.prisma.aiUsageLog.groupBy({
          by: ['model'],
          where,
          _sum: {
            inputTokens: true,
            outputTokens: true,
            estimatedCostUsd: true,
          },
          _count: { id: true },
        }),
        this.prisma.aiUsageLog.groupBy({
          by: ['userId'],
          where,
          _sum: {
            inputTokens: true,
            outputTokens: true,
            estimatedCostUsd: true,
          },
          _count: { id: true },
        }),
        this.prisma.aiUsageLog.count({
          where: { ...where, usedFallback: true },
        }),
        this.prisma.aiUsageLog.aggregate({
          where,
          _sum: {
            inputTokens: true,
            outputTokens: true,
            estimatedCostUsd: true,
          },
          _count: { id: true },
        }),
      ]);

    const userIds = byUserRows
      .map((row) => row.userId)
      .filter((id): id is string => id !== null);
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds }, tenantId: query.tenantId },
            select: { id: true, email: true },
          })
        : [];
    const userEmailById = new Map(users.map((user) => [user.id, user.email]));

    const totalInputTokens = totals._sum.inputTokens ?? 0;
    const totalOutputTokens = totals._sum.outputTokens ?? 0;
    const totalCostUsd = Number(totals._sum.estimatedCostUsd ?? 0);

    return {
      totalRequests: totals._count.id,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCostUsd,
      fallbackCount,
      byProvider: byProvider.map((row) => ({
        provider: row.provider,
        requests: row._count.id,
        inputTokens: row._sum.inputTokens ?? 0,
        outputTokens: row._sum.outputTokens ?? 0,
        totalTokens: (row._sum.inputTokens ?? 0) + (row._sum.outputTokens ?? 0),
        estimatedCostUsd: Number(row._sum.estimatedCostUsd ?? 0),
      })),
      byModel: byModel.map((row) => ({
        model: row.model,
        requests: row._count.id,
        inputTokens: row._sum.inputTokens ?? 0,
        outputTokens: row._sum.outputTokens ?? 0,
        totalTokens: (row._sum.inputTokens ?? 0) + (row._sum.outputTokens ?? 0),
        estimatedCostUsd: Number(row._sum.estimatedCostUsd ?? 0),
      })),
      byUser: byUserRows.map((row) => ({
        userId: row.userId,
        userEmail: row.userId
          ? (userEmailById.get(row.userId) ?? 'Unknown user')
          : 'API / system',
        requests: row._count.id,
        inputTokens: row._sum.inputTokens ?? 0,
        outputTokens: row._sum.outputTokens ?? 0,
        totalTokens: (row._sum.inputTokens ?? 0) + (row._sum.outputTokens ?? 0),
        estimatedCostUsd: Number(row._sum.estimatedCostUsd ?? 0),
      })),
    };
  }

  async getTimeline(query: GetUsageTimelineQuery) {
    const days = Math.min(Math.max(query.days ?? 30, 1), 90);
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - (days - 1));

    const projectFilter = query.projectId
      ? Prisma.sql`AND project_id = ${query.projectId}::uuid`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      Array<{
        day: Date;
        input_tokens: bigint;
        output_tokens: bigint;
        requests: bigint;
        cost_usd: Prisma.Decimal;
      }>
    >`
      SELECT date_trunc('day', created_at) AS day,
             sum(input_tokens)::bigint AS input_tokens,
             sum(output_tokens)::bigint AS output_tokens,
             count(*)::bigint AS requests,
             sum(estimated_cost_usd) AS cost_usd
      FROM ai_usage_logs
      WHERE tenant_id = ${query.tenantId}::uuid
        AND created_at >= ${from}
        ${projectFilter}
      GROUP BY day
      ORDER BY day ASC
    `;

    return {
      days,
      points: rows.map((row) => {
        const inputTokens = Number(row.input_tokens);
        const outputTokens = Number(row.output_tokens);
        return {
          date: row.day.toISOString().slice(0, 10),
          requests: Number(row.requests),
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          estimatedCostUsd: Number(row.cost_usd),
        };
      }),
    };
  }

  async getAccountUsage(query: GetAccountUsageQuery) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: query.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        planStatus: true,
        subscriptionSince: true,
        monthlyTokenQuota: true,
        createdAt: true,
      },
    });

    const lifetime = await this.getSummary(
      new GetUsageSummaryQuery(query.tenantId),
    );

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const thisMonth = await this.getSummary(
      new GetUsageSummaryQuery(query.tenantId, undefined, monthStart),
    );

    const timeline = await this.getTimeline(
      new GetUsageTimelineQuery(query.tenantId, 30),
    );

    const quotaUsedPercent =
      tenant.monthlyTokenQuota && tenant.monthlyTokenQuota > 0
        ? Math.min(
            100,
            Math.round(
              (thisMonth.totalTokens / tenant.monthlyTokenQuota) * 100,
            ),
          )
        : null;

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        planStatus: tenant.planStatus,
        subscriptionSince: tenant.subscriptionSince ?? tenant.createdAt,
        monthlyTokenQuota: tenant.monthlyTokenQuota,
      },
      lifetime,
      thisMonth,
      quotaUsedPercent,
      timeline,
    };
  }

  private buildWhere(
    query: GetUsageAnalyticsQuery | GetUsageSummaryQuery,
  ): UsageWhereInput {
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
