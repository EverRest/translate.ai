import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import {
  TranslationCreateJobPayload,
  TranslationProcessJobPayload,
  TranslationRetryJobPayload,
} from '../../shared/constants/job-payloads';

@Injectable()
export class TranslationQueueService {
  constructor(
    @InjectQueue(QUEUES.TRANSLATION_CREATE)
    private readonly createQueue: Queue,
    @InjectQueue(QUEUES.TRANSLATION_PROCESS)
    private readonly processQueue: Queue,
    @InjectQueue(QUEUES.TRANSLATION_RETRY)
    private readonly retryQueue: Queue,
  ) {}

  enqueueCreate(payload: TranslationCreateJobPayload): Promise<void> {
    const jobId = `create-${payload.jobId}`;
    return this.createQueue
      .getJob(jobId)
      .then((existing) => (existing ? existing.remove() : undefined))
      .then(() =>
        this.createQueue.add('create', payload, {
          jobId,
          removeOnComplete: 1000,
        }),
      )
      .then(() => undefined);
  }

  enqueueProcess(payload: TranslationProcessJobPayload): Promise<void> {
    return this.processQueue
      .add('process', payload, {
        jobId: `process-${payload.jobItemId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })
      .then(() => undefined);
  }

  enqueueRetry(payload: TranslationRetryJobPayload): Promise<void> {
    return this.retryQueue
      .add('retry', payload, {
        jobId: `retry-${payload.jobId}-${Date.now()}`,
        removeOnComplete: 100,
      })
      .then(() => undefined);
  }
}
