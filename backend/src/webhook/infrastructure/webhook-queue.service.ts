import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { QUEUES } from '../../shared/constants/queues';
import { WebhookSendJobPayload } from '../../shared/constants/job-payloads';

@Injectable()
export class WebhookQueueService {
  constructor(
    @InjectQueue(QUEUES.WEBHOOK_SEND) private readonly webhookQueue: Queue,
  ) {}

  enqueue(payload: Omit<WebhookSendJobPayload, 'eventId'>): Promise<void> {
    const eventId = randomUUID();
    return this.webhookQueue
      .add(
        'send',
        { ...payload, eventId },
        {
          jobId: `${payload.event}-${payload.webhookId}-${eventId}`,
          attempts: 5,
          backoff: { type: 'exponential', delay: 60_000 },
          removeOnComplete: 1000,
        },
      )
      .then(() => undefined);
  }
}
