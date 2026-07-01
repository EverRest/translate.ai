import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import {
  JobItemStatus,
  JobStatus,
  QualityMetricSource,
  QualityVerdict,
  TranslationJobMode,
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
import {
  loadReferenceTranslations,
  shouldIncludeReferenceTranslations,
} from '../utils/reference-translation.utils';
import { JobCompletionService } from './job-completion.service';
import { StaleTranslationService } from './stale-translation.service';
import { TranslateTextService } from './translate-text.service';
import { TranslationOutputValidator } from './translation-output.validator';
import { TranslationQueueService } from '../../infrastructure/translation-queue.service';
import {
  isObjectBatchLeaderItem,
  shouldEnqueueObjectBatchItem,
} from '../utils/object-batch-progress.utils';

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
    private readonly staleTranslations: StaleTranslationService,
  ) {}

  async handleCreate(payload: TranslationCreateJobPayload): Promise<void> {
    const job = await this.prisma.translationJob.findUnique({
      where: { id: payload.jobId },
      include: {
        items: { include: { translationKey: { select: { key: true } } } },
      },
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
        const shouldEnqueue =
          job.mode === TranslationJobMode.object_batch
            ? shouldEnqueueObjectBatchItem(item, job.items)
            : true;

        if (shouldEnqueue) {
          await this.queue.enqueueProcess({
            jobItemId: item.id,
            jobId: job.id,
            tenantId: payload.tenantId,
            correlationId: payload.correlationId,
          });
        }
      }
    }
  }

  async handleProcess(payload: TranslationProcessJobPayload): Promise<void> {
    const item = await this.prisma.translationJobItem.findUnique({
      where: { id: payload.jobItemId },
      include: {
        translationKey: {
          include: {
            project: {
              select: { name: true, description: true, domainProfile: true },
            },
          },
        },
        job: {
          include: {
            items: { include: { translationKey: { select: { key: true } } } },
          },
        },
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

    if (
      item.job.mode === TranslationJobMode.object_batch &&
      item.batchGroupId
    ) {
      if (!isObjectBatchLeaderItem(item, item.job.items)) {
        return;
      }
      await this.processObjectBatchItem(item, payload);
      await this.jobCompletion.checkAndFinalize(item.jobId, payload.tenantId);
      return;
    }

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

      const referenceTranslations = await loadReferenceTranslations(
        this.prisma,
        item.translationKeyId,
        item.language,
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
          ...(shouldIncludeReferenceTranslations(
            attempt,
            payload.includeReferenceTranslations,
            referenceTranslations.length,
          )
            ? { referenceTranslations }
            : {}),
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
            sourceTextSnapshot: sourceText,
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
            sourceTextSnapshot: sourceText,
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
      include: { translationKey: { select: { key: true } } },
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
    }

    const jobWithItems = await this.prisma.translationJob.findUnique({
      where: { id: payload.jobId },
      include: {
        items: { include: { translationKey: { select: { key: true } } } },
      },
    });

    for (const item of failedItems) {
      const shouldEnqueue =
        jobWithItems?.mode === TranslationJobMode.object_batch
          ? shouldEnqueueObjectBatchItem(item, jobWithItems.items)
          : true;

      if (shouldEnqueue) {
        await this.queue.enqueueProcess({
          jobItemId: item.id,
          jobId: payload.jobId,
          tenantId: payload.tenantId,
          includeReferenceTranslations: true,
        });
      }
    }
  }

  publishJobCreated(jobId: string, projectId: string, tenantId: string): void {
    this.eventBus.publish(
      new TranslationJobCreatedEvent(jobId, projectId, tenantId),
    );
  }

  private async processObjectBatchItem(
    leaderItem: {
      id: string;
      jobId: string;
      batchGroupId: string | null;
      language: string;
      job: {
        projectId: string;
        provider: string | null;
        createdById: string | null;
      };
    },
    payload: TranslationProcessJobPayload,
  ): Promise<void> {
    const batchItems = await this.prisma.translationJobItem.findMany({
      where: {
        jobId: leaderItem.jobId,
        batchGroupId: leaderItem.batchGroupId!,
        language: leaderItem.language,
      },
      include: {
        translationKey: {
          include: {
            project: {
              select: { name: true, description: true, domainProfile: true },
            },
          },
        },
      },
    });

    const emptyItems = batchItems.filter(
      (item) => !item.translationKey.sourceText?.trim(),
    );
    for (const item of emptyItems) {
      await this.markItemFailed(
        item.id,
        'Translation key has empty source text',
      );
      this.metrics.recordTranslationJobItem('failed');
    }

    const translatableItems = batchItems.filter((item) =>
      item.translationKey.sourceText?.trim(),
    );

    if (translatableItems.length === 0) {
      return;
    }

    await this.prisma.translationJobItem.updateMany({
      where: { id: { in: translatableItems.map((item) => item.id) } },
      data: { status: JobItemStatus.processing },
    });

    const glossaryTerms = await this.glossary.getTermsForProject(
      leaderItem.job.projectId,
    );
    const fieldNode = leaderItem.batchGroupId
      ? await this.prisma.localizationNode.findUnique({
          where: { id: leaderItem.batchGroupId },
          select: { label: true },
        })
      : null;

    const referenceItem = translatableItems[0];
    const baseOptions = buildTranslateOptionsFromKey(
      referenceItem.translationKey,
      referenceItem.translationKey.project,
      {
        glossary: glossaryTerms.length > 0 ? glossaryTerms : undefined,
      },
    );

    const strings = translatableItems.map((item) => ({
      keyPath: item.translationKey.key,
      role: roleFromKeyPath(item.translationKey.key),
      sourceText: item.translationKey.sourceText.trim(),
      contentType: item.translationKey.contentType ?? undefined,
    }));

    const sourceLang = this.config.get<string>('DEFAULT_SOURCE_LANGUAGE', 'en');

    let lastFailureReason = 'Object batch validation failed';
    let batchResult: Record<string, string> | null = null;
    let resultProvider = resolveJobAiProvider(leaderItem.job.provider);

    for (let attempt = 1; attempt <= MAX_TRANSLATION_ATTEMPTS; attempt += 1) {
      const retryHint =
        attempt > 1 ? buildObjectBatchRetryHint(lastFailureReason) : undefined;

      try {
        const result = await this.translateText.translateObjectBatch({
          tenantId: payload.tenantId,
          userId: leaderItem.job.createdById ?? undefined,
          projectId: leaderItem.job.projectId,
          jobId: leaderItem.jobId,
          jobItemId: leaderItem.id,
          strings,
          targetLang: leaderItem.language,
          providerName: resolveJobAiProvider(leaderItem.job.provider),
          options: {
            ...baseOptions,
            fieldLabel: fieldNode?.label ?? undefined,
            retryHint,
          },
          sourceLang,
        });

        let allValid = true;
        for (const item of translatableItems) {
          const translated = result.translations[item.translationKey.key];
          const validation = this.outputValidator.validate(
            translated,
            item.translationKey.sourceText,
            sourceLang,
            item.language,
          );
          if (!validation.valid) {
            allValid = false;
            lastFailureReason =
              validation.reason ?? 'Object batch validation failed';
            break;
          }
        }

        if (allValid) {
          batchResult = result.translations;
          resultProvider = resolveStoredTranslationProvider(
            result.provider,
            leaderItem.job.provider,
          );
          break;
        }
      } catch (error) {
        lastFailureReason =
          error instanceof Error ? error.message : String(error);
      }

      this.logger.warn(
        `Object batch validation failed for group ${leaderItem.batchGroupId} attempt ${attempt}/${MAX_TRANSLATION_ATTEMPTS}: ${lastFailureReason}`,
      );
    }

    if (!batchResult) {
      for (const item of translatableItems) {
        await this.markItemFailed(
          item.id,
          `Validation failed after ${MAX_TRANSLATION_ATTEMPTS} attempts: ${lastFailureReason}`,
        );
        this.metrics.recordTranslationJobItem('failed');
      }
      return;
    }

    for (const item of translatableItems) {
      const sourceText = item.translationKey.sourceText;
      const resultText = batchResult[item.translationKey.key];

      try {
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
              sourceTextSnapshot: sourceText,
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
              sourceTextSnapshot: sourceText,
            },
          });
          translationId = created.id;
        }

        await this.quality.record({
          tenantId: payload.tenantId,
          projectId: leaderItem.job.projectId,
          translationId,
          language: item.language,
          translationKey: item.translationKey.key,
          sourceText,
          aiValue: resultText,
          score: 0.85,
          verdict: QualityVerdict.needs_edit,
          source: QualityMetricSource.job_completion,
          provider: resultProvider,
          jobId: leaderItem.jobId,
          jobItemId: item.id,
          notes: 'Object batch validation passed at job completion',
        });

        await this.prisma.translationJobItem.update({
          where: { id: item.id },
          data: { status: JobItemStatus.completed },
        });
        this.metrics.recordTranslationJobItem('completed');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this.markItemFailed(item.id, message);
        this.metrics.recordTranslationJobItem('failed');
      }
    }
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

function buildObjectBatchRetryHint(reason: string): string {
  return `Previous attempt was rejected: ${reason}. Return only valid JSON with keyPath and translatedText for every string.`;
}

function roleFromKeyPath(keyPath: string): string {
  const segments = keyPath.split('.');
  const last = segments[segments.length - 1] ?? 'text';
  if (['label', 'placeholder', 'hint', 'button'].includes(last)) {
    return last;
  }
  if (segments.includes('errors')) {
    return 'error';
  }
  return last;
}
