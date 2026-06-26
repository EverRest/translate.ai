import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
  TranslationJobCompletedWebhookHandler,
  TranslationJobCreatedWebhookHandler,
  TranslationJobFailedWebhookHandler,
} from './application/handlers/translation-job-webhook.handlers';
import { TranslationPublishedWebhookHandler } from './application/handlers/translation-published-webhook.handler';
import { WebhookDeliveryService } from './application/webhook-delivery.service';
import { WebhookQueueService } from './infrastructure/webhook-queue.service';

const eventHandlers = [
  TranslationJobCreatedWebhookHandler,
  TranslationJobCompletedWebhookHandler,
  TranslationJobFailedWebhookHandler,
  TranslationPublishedWebhookHandler,
];

@Module({
  imports: [CqrsModule],
  providers: [WebhookQueueService, WebhookDeliveryService, ...eventHandlers],
  exports: [WebhookQueueService, WebhookDeliveryService],
})
export class WebhookModule {}
