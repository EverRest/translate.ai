import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';

export interface ImportParseJobPayload {
  sessionId: string;
  tenantId: string;
}

export interface ImportApplyJobPayload {
  sessionId: string;
  tenantId: string;
  conflictStrategy?: 'skip' | 'update';
}

@Injectable()
export class ImportQueueService {
  constructor(
    @InjectQueue(QUEUES.INTEGRATION_IMPORT_PARSE)
    private readonly parseQueue: Queue<ImportParseJobPayload>,
    @InjectQueue(QUEUES.INTEGRATION_IMPORT_APPLY)
    private readonly applyQueue: Queue<ImportApplyJobPayload>,
  ) {}

  enqueueParse(payload: ImportParseJobPayload): Promise<void> {
    return this.parseQueue
      .add('parse', payload, {
        jobId: `import-parse-${payload.sessionId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      })
      .then(() => undefined);
  }

  enqueueApply(payload: ImportApplyJobPayload): Promise<void> {
    return this.applyQueue
      .add('apply', payload, {
        jobId: `import-apply-${payload.sessionId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      })
      .then(() => undefined);
  }
}
