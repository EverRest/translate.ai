import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import {
  JobItemStatus,
  JobStatus,
  QualityMetricSource,
  TranslationStatus,
} from '@prisma/client';
import { inferContentTypeFromContext } from '../../../ai-provider/application/content-classifier.utils';
import { TranslationQualityService } from '../../../billing/application/translation-quality.service';
import { GlossaryService } from '../../../glossary/application/glossary.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { MetricsService } from '../../../shared/monitoring/metrics.service';
import {
  TranslationProcessJobPayload,
  TranslationCreateJobPayload,
  TranslationRetryJobPayload,
} from '../../../shared/constants/job-payloads';
import { TranslationJobCreatedEvent } from '../../domain/events/translation-job.events';
import { JobCompletionService } from './job-completion.service';
import { TranslateTextService } from './translate-text.service';
import { TranslationQueueService } from '../../infrastructure/translation-queue.service';

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
        translationKey: true,
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
      await this.markItemFailed(item.id);
      this.metrics.recordTranslationJobItem('failed');
      await this.jobCompletion.checkAndFinalize(item.jobId, payload.tenantId);
      return;
    }

    try {
      const glossaryTerms = await this.glossary.getTermsForProject(
        item.job.projectId,
      );

      const keyContext =
        item.translationKey.context ??
        item.translationKey.description ??
        undefined;

      const result = await this.translateText.translate({
        tenantId: payload.tenantId,
        projectId: item.job.projectId,
        jobId: item.jobId,
        jobItemId: item.id,
        text: sourceText,
        targetLang: item.language,
        providerName: item.job.provider ?? 'openai',
        options: {
          context: keyContext,
          contentType: inferContentTypeFromContext(keyContext),
          glossary: glossaryTerms.length > 0 ? glossaryTerms : undefined,
        },
        sourceLang: this.config.get<string>('DEFAULT_SOURCE_LANGUAGE', 'en'),
      });

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
            value: result.text,
            status: TranslationStatus.draft,
            provider: result.provider,
            version: existing.version + 1,
          },
        });
        translationId = updated.id;
      } else {
        const created = await this.prisma.translation.create({
          data: {
            translationKeyId: item.translationKeyId,
            language: item.language,
            value: result.text,
            status: TranslationStatus.draft,
            provider: result.provider,
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
        aiValue: result.text,
        source: QualityMetricSource.job_completion,
        provider: result.provider,
        jobId: item.jobId,
        jobItemId: item.id,
        notes: 'Unverified AI output at job completion',
      });

      await this.prisma.translationJobItem.update({
        where: { id: item.id },
        data: { status: JobItemStatus.completed },
      });
      this.metrics.recordTranslationJobItem('completed');
    } catch (error) {
      this.logger.warn(
        `Failed to process item ${item.id}: ${error instanceof Error ? error.message : error}`,
      );
      await this.markItemFailed(item.id);
      this.metrics.recordTranslationJobItem('failed');
    }

    await this.jobCompletion.checkAndFinalize(item.jobId, payload.tenantId);
  }

  async handleRetry(payload: TranslationRetryJobPayload): Promise<void> {
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
        data: { status: JobItemStatus.pending },
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

  private async markItemFailed(itemId: string): Promise<void> {
    await this.prisma.translationJobItem.update({
      where: { id: itemId },
      data: { status: JobItemStatus.failed },
    });
  }
}
