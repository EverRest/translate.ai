import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { TerminologyScanJobPayload } from '../../shared/constants/job-payloads';

@Injectable()
export class TerminologyQueueService {
  constructor(
    @InjectQueue(QUEUES.TERMINOLOGY_SCAN)
    private readonly terminologyQueue: Queue,
  ) {}

  enqueueScan(payload: TerminologyScanJobPayload): Promise<void> {
    return this.terminologyQueue
      .add('scan', payload, {
        jobId: `terminology-scan-${payload.projectId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })
      .then(() => undefined);
  }
}
