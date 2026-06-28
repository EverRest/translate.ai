import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import {
  JobItemStatus,
  JobStatus,
  QualityMetricSource,
  QualityVerdict,
  TranslationStatus,
} from '@prisma/client';
import { TranslationQualityService } from '../../../billing/application/translation-quality.service';
import { GlossaryService } from '../../../glossary/application/glossary.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { MetricsService } from '../../../shared/monitoring/metrics.service';
import {
  cyrillicScriptHint,
  isCyrillicTargetLang,
} from '../../../shared/utils/language-script.utils';
import {
  resolveJobAiProvider,
  resolveStoredTranslationProvider,
  isPseudoProvider,
} from '../../../ai-provider/domain/ai-provider.utils';
import {
  TranslationProcessJobPayload,
  TranslationCreateJobPayload,
  TranslationRetryJobPayload,
} from '../../../shared/constants/job-payloads';
import { TranslationJobCreatedEvent } from '../../domain/events/translation-job.events';
import { buildTranslateOptionsFromKey } from '../utils/translation-context.utils';
import { JobCompletionService } from './job-completion.service';
import { TranslateTextService } from './translate-text.service';
import { TranslationOutputValidator } from './translation-output.validator';
import { TranslationQueueService } from '../../infrastructure/translation-queue.service';

const MAX_TRANSLATION_ATTEMPTS = 3;

@Injectable()
export class TranslationJobRunnerService {
  private readonly logger = new Logger(TranslationJobRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly translateText: TranslateTextService,
    private readonly jobCompletion: JobCompletionService,
    private readonly queue: TranslationQueueService,
    private readonly eventBus: EventBus,
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
    private readonly glossary: GlossaryService,
    private readonly quality: TranslationQualityService,
    private readonly outputValidator: TranslationOutputValidator,
  ) {}

  async handleCreate(payload: TranslationCreateJobPayload): Promise<void> {
    const job = await this.prisma.translationJob.findUnique({
      where: { id: payload.jobId },
      include: { items: true },
    });
    if (!job || job.status === JobStatus.cancelled) {
      return;
    }

    await this.prisma.translationJob.update({
      where: { id: job.id },
      data: { status: JobStatus.processing },
    });

    for (const item of job.items) {
      if (item.status === JobItemStatus.pending) {
        await this.queue.enqueueProcess({
          jobItemId: item.id,
          jobId: job.id,
          tenantId: payload.tenantId,
          correlationId: payload.correlationId,
        });
      }
    }
  }

  async handleProcess(payload: TranslationProcessJobPayload): Promise<void> {
    const item = await this.prisma.translationJobItem.findUnique({
      where: { id: payload.jobItemId },
      include: {
        translationKey: {
          include: {
            project: { select: { name: true, description: true } },
          },
        },
        job: true,
      },
    });

    if (!item || !item.job) {
      return;
    }

    if (
      item.status === JobItemStatus.completed ||
      item.job.status === JobStatus.cancelled
    ) {
      return;
    }

    await this.prisma.translationJobItem.update({
      where: { id: item.id },
      data: { status: JobItemStatus.processing },
    });

    const sourceText = item.translationKey.sourceText;
    if (!sourceText?.trim()) {
      await this.markItemFailed(
        item.id,
        'Translation key has empty source text',
      );
      this.metrics.recordTranslationJobItem('failed');
      await this.jobCompletion.checkAndFinalize(item.jobId, payload.tenantId);
      return;
    }

    try {
      const glossaryTerms = await this.glossary.getTermsForProject(
        item.job.projectId,
      );

      const baseOptions = buildTranslateOptionsFromKey(
        item.translationKey,
        item.translationKey.project,
        {
          glossary: glossaryTerms.length > 0 ? glossaryTerms : undefined,
        },
      );

      const sourceLang = this.config.get<string>(
        'DEFAULT_SOURCE_LANGUAGE',
        'en',
      );

      let lastFailureReason = 'Translation validation failed';
      let succeeded = false;
      let resultText = '';
      let resultProvider = resolveJobAiProvider(item.job.provider);

      for (let attempt = 1; attempt <= MAX_TRANSLATION_ATTEMPTS; attempt += 1) {
        const retryHint =
          attempt > 1
            ? buildValidationRetryHint(lastFailureReason, item.language)
            : undefined;

        const translateOptions = {
          ...baseOptions,
          ...(retryHint ? { retryHint } : {}),
        };

        const result = await this.translateText.translate({
          tenantId: payload.tenantId,
          userId: item.job.createdById ?? undefined,
          projectId: item.job.projectId,
          jobId: item.jobId,
          jobItemId: item.id,
          text: sourceText,
          targetLang: item.language,
          providerName: resolveJobAiProvider(item.job.provider),
          options: translateOptions,
          sourceLang,
          skipMemory: attempt > 1,
        });

        const validation = this.outputValidator.validate(
          result.text,
          sourceText,
          sourceLang,
          item.language,
        );

        if (validation.valid) {
          resultText = result.text;
          resultProvider = resolveStoredTranslationProvider(
            result.provider,
            item.job.provider,
          );
          succeeded = true;
          break;
        }

        lastFailureReason =
          validation.reason ?? 'Translation validation failed';
        this.logger.warn(
          `Validation failed for item ${item.id} attempt ${attempt}/${MAX_TRANSLATION_ATTEMPTS}: ${lastFailureReason}`,
        );
      }

      if (!succeeded) {
        await this.markItemFailed(
          item.id,
          `Validation failed after ${MAX_TRANSLATION_ATTEMPTS} attempts: ${lastFailureReason}`,
        );
        this.metrics.recordTranslationJobItem('failed');
        await this.jobCompletion.checkAndFinalize(item.jobId, payload.tenantId);
        return;
      }

      const existing = await this.prisma.translation.findFirst({
        where: {
          translationKeyId: item.translationKeyId,
          language: item.language,
        },
      });

      let translationId: string;

      if (existing) {
        const updated = await this.prisma.translation.update({
          where: { id: existing.id },
          data: {
            value: resultText,
            status: TranslationStatus.draft,
            provider: resultProvider,
            version: existing.version + 1,
          },
        });
        translationId = updated.id;
      } else {
        const created = await this.prisma.translation.create({
          data: {
            translationKeyId: item.translationKeyId,
            language: item.language,
            value: resultText,
            status: TranslationStatus.draft,
            provider: resultProvider,
          },
        });
        translationId = created.id;
      }

      await this.quality.record({
        tenantId: payload.tenantId,
        projectId: item.job.projectId,
        translationId,
        language: item.language,
        translationKey: item.translationKey.key,
        sourceText,
        aiValue: resultText,
        score: 0.85,
        verdict: QualityVerdict.needs_edit,
        source: QualityMetricSource.job_completion,
        provider: resultProvider,
        jobId: item.jobId,
        jobItemId: item.id,
        notes: 'Heuristic validation passed at job completion',
      });

      await this.prisma.translationJobItem.update({
        where: { id: item.id },
        data: { status: JobItemStatus.completed },
      });
      this.metrics.recordTranslationJobItem('completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to process item ${item.id}: ${message}`);
      await this.markItemFailed(item.id, message);
      this.metrics.recordTranslationJobItem('failed');
    }

    await this.jobCompletion.checkAndFinalize(item.jobId, payload.tenantId);
  }

  async handleRetry(payload: TranslationRetryJobPayload): Promise<void> {
    const job = await this.prisma.translationJob.findUnique({
      where: { id: payload.jobId },
    });

    if (job && isPseudoProvider(job.provider)) {
      await this.prisma.translationJob.update({
        where: { id: payload.jobId },
        data: { provider: resolveJobAiProvider(job.provider) },
      });
    }

    const failedItems = await this.prisma.translationJobItem.findMany({
      where: { jobId: payload.jobId, status: JobItemStatus.failed },
    });

    await this.prisma.translationJob.update({
      where: { id: payload.jobId },
      data: { status: JobStatus.processing },
    });

    for (const item of failedItems) {
      await this.prisma.translationJobItem.update({
        where: { id: item.id },
        data: { status: JobItemStatus.pending, errorMessage: null },
      });
      await this.queue.enqueueProcess({
        jobItemId: item.id,
        jobId: payload.jobId,
        tenantId: payload.tenantId,
      });
    }
  }

  publishJobCreated(jobId: string, projectId: string, tenantId: string): void {
    this.eventBus.publish(
      new TranslationJobCreatedEvent(jobId, projectId, tenantId),
    );
  }

  private async markItemFailed(
    itemId: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.translationJobItem.update({
      where: { id: itemId },
      data: {
        status: JobItemStatus.failed,
        errorMessage: errorMessage?.slice(0, 2000),
      },
    });
  }
}

function buildValidationRetryHint(reason: string, targetLang: string): string {
  let hint = `Previous attempt was rejected: ${reason}. Return only the translated text.`;
  if (
    isCyrillicTargetLang(targetLang) &&
    reason.toLowerCase().includes('script')
  ) {
    hint += ` ${cyrillicScriptHint(targetLang)}`;
  }
  return hint;
}
