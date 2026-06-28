import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { TranslationEmbedJobPayload } from '../../shared/constants/job-payloads';

@Injectable()
export class EmbedQueueService {
  constructor(
    @InjectQueue(QUEUES.TRANSLATION_EMBED)
    private readonly embedQueue: Queue,
  ) {}

  enqueueEmbed(payload: TranslationEmbedJobPayload): Promise<void> {
    const jobId = payload.memoryId
      ? `embed-${payload.memoryId}`
      : `embed-batch-${payload.tenantId}-${Date.now()}`;

    return this.embedQueue
      .add('embed', payload, {
        jobId,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })
      .then(() => undefined);
  }
}
