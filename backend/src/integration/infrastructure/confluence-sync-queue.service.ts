import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import type { ConfluenceSyncJobPayload } from '../application/confluence-sync-job-runner.service';

@Injectable()
export class ConfluenceSyncQueueService {
  constructor(
    @InjectQueue(QUEUES.INTEGRATION_CONFLUENCE_SYNC)
    private readonly queue: Queue<ConfluenceSyncJobPayload>,
  ) {}

  enqueue(payload: ConfluenceSyncJobPayload): Promise<void> {
    return this.queue
      .add('sync', payload, {
        jobId: `confluence-sync-${payload.sessionId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })
      .then(() => undefined);
  }
}
