import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { LocalizationObjectGenerateJobPayload } from '../../shared/constants/job-payloads';

@Injectable()
export class LocalizationObjectQueueService {
  constructor(
    @InjectQueue(QUEUES.LOCALIZATION_OBJECT_GENERATE)
    private readonly queue: Queue,
  ) {}

  enqueueGenerate(
    payload: LocalizationObjectGenerateJobPayload,
  ): Promise<void> {
    return this.queue
      .add('generate', payload, {
        jobId: `localization-generate-${payload.objectId}`,
        removeOnComplete: 1000,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      })
      .then(() => undefined);
  }
}
