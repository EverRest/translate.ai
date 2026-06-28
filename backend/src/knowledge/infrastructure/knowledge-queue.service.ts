import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { KnowledgeIngestJobPayload } from '../../shared/constants/job-payloads';

@Injectable()
export class KnowledgeQueueService {
  constructor(
    @InjectQueue(QUEUES.KNOWLEDGE_INGEST)
    private readonly knowledgeQueue: Queue,
  ) {}

  enqueueIngest(payload: KnowledgeIngestJobPayload): Promise<void> {
    return this.knowledgeQueue
      .add('ingest', payload, {
        jobId: `knowledge-ingest-${payload.sourceId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })
      .then(() => undefined);
  }
}
