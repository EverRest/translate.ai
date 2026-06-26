import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { TranslationPublishedEvent } from '../../../approval/domain/events/translation-approval.events';
import { WebhookQueueService } from '../../infrastructure/webhook-queue.service';

@Injectable()
@EventsHandler(TranslationPublishedEvent)
export class TranslationPublishedWebhookHandler implements IEventHandler<TranslationPublishedEvent> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookQueue: WebhookQueueService,
  ) {}

  async handle(event: TranslationPublishedEvent): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { projectId: event.projectId, enabled: true },
    });

    for (const webhook of webhooks) {
      await this.webhookQueue.enqueue({
        webhookId: webhook.id,
        projectId: event.projectId,
        tenantId: event.tenantId,
        event: 'translation.approved',
        data: {
          translationId: event.translationId,
          projectId: event.projectId,
          key: event.key,
          language: event.language,
          status: 'published',
        },
      });
    }
  }
}
