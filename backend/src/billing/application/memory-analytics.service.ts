import { Injectable } from '@nestjs/common';
import { MemoryHitType, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

export class GetMemoryCacheSummaryQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId?: string,
    public readonly from?: Date,
    public readonly to?: Date,
  ) {}
}

type MemoryHitWhereInput = Prisma.TranslationMemoryHitWhereInput;
type AiUsageWhereInput = Prisma.AiUsageLogWhereInput;

export interface MemoryCacheSummary {
  totalHits: number;
  memoryHitExact: number;
  memoryHitSemantic: number;
  llmCalls: number;
  exactHitRate: number;
  semanticHitRate: number;
  combinedHitRate: number;
  timeline: Array<{ date: string; exact: number; semantic: number }>;
}

@Injectable()
export class MemoryAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    query: GetMemoryCacheSummaryQuery,
  ): Promise<MemoryCacheSummary> {
    const hitWhere = this.buildHitWhere(query);
    const usageWhere = this.buildUsageWhere(query);

    const [exactCount, semanticCount, llmCalls, timelineRows] =
      await Promise.all([
        this.prisma.translationMemoryHit.count({
          where: { ...hitWhere, hitType: MemoryHitType.exact },
        }),
        this.prisma.translationMemoryHit.count({
          where: { ...hitWhere, hitType: MemoryHitType.semantic },
        }),
        this.prisma.aiUsageLog.count({ where: usageWhere }),
        this.prisma.translationMemoryHit.findMany({
          where: hitWhere,
          select: { hitType: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    const memoryHitExact = exactCount;
    const memoryHitSemantic = semanticCount;
    const totalHits = memoryHitExact + memoryHitSemantic + llmCalls;
    const exactHitRate = totalHits > 0 ? memoryHitExact / totalHits : 0;
    const semanticHitRate = totalHits > 0 ? memoryHitSemantic / totalHits : 0;
    const combinedHitRate =
      totalHits > 0 ? (memoryHitExact + memoryHitSemantic) / totalHits : 0;

    const timeline = this.buildTimeline(timelineRows);

    return {
      totalHits,
      memoryHitExact,
      memoryHitSemantic,
      llmCalls,
      exactHitRate,
      semanticHitRate,
      combinedHitRate,
      timeline,
    };
  }

  private buildHitWhere(
    query: GetMemoryCacheSummaryQuery,
  ): MemoryHitWhereInput {
    const where: MemoryHitWhereInput = { tenantId: query.tenantId };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = query.from;
      }
      if (query.to) {
        where.createdAt.lte = query.to;
      }
    }

    return where;
  }

  private buildUsageWhere(
    query: GetMemoryCacheSummaryQuery,
  ): AiUsageWhereInput {
    const where: AiUsageWhereInput = { tenantId: query.tenantId };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = query.from;
      }
      if (query.to) {
        where.createdAt.lte = query.to;
      }
    }

    return where;
  }

  private buildTimeline(
    rows: Array<{ hitType: MemoryHitType; createdAt: Date }>,
  ): Array<{ date: string; exact: number; semantic: number }> {
    const buckets = new Map<string, { exact: number; semantic: number }>();

    for (const row of rows) {
      const date = row.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.get(date) ?? { exact: 0, semantic: 0 };
      if (row.hitType === MemoryHitType.exact) {
        bucket.exact += 1;
      } else {
        bucket.semantic += 1;
      }
      buckets.set(date, bucket);
    }

    return [...buckets.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, counts]) => ({ date, ...counts }));
  }
}
