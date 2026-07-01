import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { JobItemStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  TranslationJobCompletedEvent,
  TranslationJobCreatedEvent,
  TranslationJobFailedEvent,
} from '../../../translation/domain/events/translation-job.events';
import { buildJobFailureSummary } from '../../../translation/application/utils/job-failure-summary';
import { buildJobPlaceholderSummary } from '../../../translation/application/utils/job-placeholder-summary';
import { WebhookQueueService } from '../../infrastructure/webhook-queue.service';

@Injectable()
@EventsHandler(TranslationJobCreatedEvent)
export class TranslationJobCreatedWebhookHandler implements IEventHandler<TranslationJobCreatedEvent> {
  private readonly logger = new Logger(
    TranslationJobCreatedWebhookHandler.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookQueue: WebhookQueueService,
  ) {}

  async handle(event: TranslationJobCreatedEvent): Promise<void> {
    await this.dispatch(event.projectId, event.tenantId, 'job.created', {
      jobId: event.jobId,
      projectId: event.projectId,
      status: 'pending',
    });
  }

  private async dispatch(
    projectId: string,
    tenantId: string,
    eventName: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { projectId, enabled: true },
    });

    for (const webhook of webhooks) {
      await this.webhookQueue.enqueue({
        webhookId: webhook.id,
        projectId,
        tenantId,
        event: eventName,
        data,
      });
    }

    this.logger.debug(
      `Enqueued ${webhooks.length} webhook(s) for ${eventName} project=${projectId}`,
    );
  }
}

@Injectable()
@EventsHandler(TranslationJobCompletedEvent)
export class TranslationJobCompletedWebhookHandler implements IEventHandler<TranslationJobCompletedEvent> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookQueue: WebhookQueueService,
  ) {}

  async handle(event: TranslationJobCompletedEvent): Promise<void> {
    const job = await this.prisma.translationJob.findUnique({
      where: { id: event.jobId },
      include: {
        items: {
          include: {
            translationKey: { select: { sourceText: true } },
          },
        },
      },
    });

    const placeholderSummary = buildJobPlaceholderSummary(
      job?.items.map((item) => ({
        translationKeyId: item.translationKeyId,
        status: item.status,
        sourceText: item.translationKey.sourceText,
      })) ?? [],
    );

    const webhooks = await this.prisma.webhook.findMany({
      where: { projectId: event.projectId, enabled: true },
    });

    for (const webhook of webhooks) {
      await this.webhookQueue.enqueue({
        webhookId: webhook.id,
        projectId: event.projectId,
        tenantId: event.tenantId,
        event: 'job.completed',
        data: {
          jobId: event.jobId,
          projectId: event.projectId,
          status: 'completed',
          ...(placeholderSummary ? { placeholderSummary } : {}),
        },
      });
    }
  }
}

@Injectable()
@EventsHandler(TranslationJobFailedEvent)
export class TranslationJobFailedWebhookHandler implements IEventHandler<TranslationJobFailedEvent> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookQueue: WebhookQueueService,
  ) {}

  async handle(event: TranslationJobFailedEvent): Promise<void> {
    const job = await this.prisma.translationJob.findUnique({
      where: { id: event.jobId },
      include: {
        items: {
          include: {
            translationKey: { select: { key: true, sourceText: true } },
          },
        },
      },
    });

    const failedItems =
      job?.items
        .filter((item) => item.status === JobItemStatus.failed)
        .map((item) => ({
          key: item.translationKey.key,
          language: item.language,
          errorMessage: item.errorMessage,
        })) ?? [];

    const failures = buildJobFailureSummary(
      failedItems
        .map((item) => item.errorMessage)
        .filter((message): message is string => Boolean(message)),
      job?.provider ?? null,
    );

    const placeholderSummary = buildJobPlaceholderSummary(
      job?.items.map((item) => ({
        translationKeyId: item.translationKeyId,
        status: item.status,
        sourceText: item.translationKey.sourceText,
      })) ?? [],
    );

    const webhooks = await this.prisma.webhook.findMany({
      where: { projectId: event.projectId, enabled: true },
    });

    for (const webhook of webhooks) {
      await this.webhookQueue.enqueue({
        webhookId: webhook.id,
        projectId: event.projectId,
        tenantId: event.tenantId,
        event: 'job.failed',
        data: {
          jobId: event.jobId,
          projectId: event.projectId,
          status: 'failed',
          failures,
          failedItems,
          ...(placeholderSummary ? { placeholderSummary } : {}),
        },
      });
    }
  }
}
