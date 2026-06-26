import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MetricsService } from '../../shared/monitoring/metrics.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TranslateContext } from '../../ai-provider/domain/ai-provider.types';
import { ProviderTranslateResult } from '../../ai-provider/infrastructure/prompt.builder';

export interface LogAiUsageInput extends TranslateContext {
  provider: string;
  primaryProvider: string;
  usedFallback: boolean;
  usage: ProviderTranslateResult['usage'];
}

@Injectable()
export class AiUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  log(input: LogAiUsageInput): Promise<void> {
    this.metrics.recordAiUsage(
      input.provider,
      input.usage.estimatedCostUsd,
      input.usedFallback,
    );

    return this.prisma.aiUsageLog
      .create({
        data: {
          tenantId: input.tenantId,
          projectId: input.projectId,
          jobId: input.jobId,
          jobItemId: input.jobItemId,
          provider: input.provider,
          model: input.usage.model,
          inputTokens: input.usage.inputTokens,
          outputTokens: input.usage.outputTokens,
          estimatedCostUsd: new Prisma.Decimal(input.usage.estimatedCostUsd),
          usedFallback: input.usedFallback,
          primaryProvider: input.primaryProvider,
        },
      })
      .then(() => undefined);
  }
}
