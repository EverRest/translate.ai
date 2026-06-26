import { Injectable, Logger } from '@nestjs/common';
import { Prisma, QualityMetricSource, QualityVerdict } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  scoreToVerdict,
  textSimilarityScore,
} from '../../shared/utils/similarity.utils';

export type RecordQualityInput = {
  tenantId: string;
  projectId: string;
  translationId: string;
  language: string;
  translationKey: string;
  sourceText: string;
  aiValue: string;
  referenceValue?: string;
  score?: number;
  source: QualityMetricSource;
  verdict?: QualityVerdict;
  notes?: string;
  provider?: string;
  jobId?: string;
  jobItemId?: string;
  createdById?: string;
};

export class GetQualitySummaryQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId?: string,
    public readonly from?: Date,
    public readonly to?: Date,
  ) {}
}

export class GetQualityLogsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId?: string,
    public readonly from?: Date,
    public readonly to?: Date,
    public readonly limit = 100,
  ) {}
}

@Injectable()
export class TranslationQualityService {
  private readonly logger = new Logger(TranslationQualityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordQualityInput) {
    const score =
      input.score ??
      (input.referenceValue
        ? textSimilarityScore(input.aiValue, input.referenceValue)
        : 1);
    const verdict = input.verdict ?? scoreToVerdict(score);

    try {
      return await this.prisma.translationQualityMetric.create({
        data: {
          tenantId: input.tenantId,
          projectId: input.projectId,
          translationId: input.translationId,
          jobId: input.jobId,
          jobItemId: input.jobItemId,
          provider: input.provider,
          language: input.language,
          translationKey: input.translationKey,
          sourceText: input.sourceText,
          aiValue: input.aiValue,
          referenceValue: input.referenceValue,
          score,
          source: input.source,
          verdict,
          notes: input.notes,
          createdById: input.createdById,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record quality metric: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  async getSummary(query: GetQualitySummaryQuery) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.translationQualityMetric.findMany({
      where,
      select: {
        score: true,
        verdict: true,
        provider: true,
        language: true,
        source: true,
      },
    });

    const total = rows.length;
    const verifiedRows = rows.filter(
      (row) => row.source !== QualityMetricSource.job_completion,
    );
    const verifiedTotal = verifiedRows.length;
    const avgScore =
      verifiedTotal === 0
        ? 0
        : verifiedRows.reduce((sum, row) => sum + Number(row.score), 0) /
          verifiedTotal;

    const byVerdict = Object.values(QualityVerdict).map((verdict) => ({
      verdict,
      count: verifiedRows.filter((row) => row.verdict === verdict).length,
    }));

    const providerMap = new Map<string, { count: number; scoreSum: number }>();
    for (const row of rows) {
      const provider = row.provider ?? 'unknown';
      const current = providerMap.get(provider) ?? { count: 0, scoreSum: 0 };
      providerMap.set(provider, {
        count: current.count + 1,
        scoreSum: current.scoreSum + Number(row.score),
      });
    }

    const byProvider = Array.from(providerMap.entries()).map(
      ([provider, stats]) => ({
        provider,
        count: stats.count,
        avgScore: stats.count ? stats.scoreSum / stats.count : 0,
      }),
    );

    const languageMap = new Map<string, { count: number; scoreSum: number }>();
    for (const row of rows) {
      const current = languageMap.get(row.language) ?? {
        count: 0,
        scoreSum: 0,
      };
      languageMap.set(row.language, {
        count: current.count + 1,
        scoreSum: current.scoreSum + Number(row.score),
      });
    }

    const byLanguage = Array.from(languageMap.entries()).map(
      ([language, stats]) => ({
        language,
        count: stats.count,
        avgScore: stats.count ? stats.scoreSum / stats.count : 0,
      }),
    );

    return {
      totalSamples: total,
      verifiedSamples: verifiedTotal,
      avgScore,
      accurateRate:
        verifiedTotal === 0
          ? 0
          : verifiedRows.filter(
              (row) => row.verdict === QualityVerdict.accurate,
            ).length / verifiedTotal,
      byVerdict,
      byProvider,
      byLanguage,
    };
  }

  async getLogs(query: GetQualityLogsQuery) {
    const where = this.buildWhere(query);

    const items = await this.prisma.translationQualityMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });

    return items.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      translationId: row.translationId,
      translationKey: row.translationKey,
      language: row.language,
      provider: row.provider,
      score: Number(row.score),
      verdict: row.verdict,
      source: row.source,
      aiValue: row.aiValue,
      referenceValue: row.referenceValue,
      notes: row.notes,
      createdAt: row.createdAt,
    }));
  }

  private buildWhere(
    query: GetQualitySummaryQuery | GetQualityLogsQuery,
  ): Prisma.TranslationQualityMetricWhereInput {
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
