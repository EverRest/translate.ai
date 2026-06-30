import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { GlossaryAnalyzeJobPayload } from '../../shared/constants/job-payloads';

@Injectable()
export class GlossaryQueueService {
  constructor(
    @InjectQueue(QUEUES.GLOSSARY_ANALYZE)
    private readonly glossaryQueue: Queue,
  ) {}

  enqueueAnalyze(payload: GlossaryAnalyzeJobPayload): Promise<void> {
    return this.glossaryQueue
      .add('analyze', payload, {
        jobId: `glossary-analyze-${payload.projectId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })
      .then(() => undefined);
  }
}
