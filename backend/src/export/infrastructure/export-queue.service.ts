import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { TranslationExportJobPayload } from '../../shared/constants/job-payloads';

@Injectable()
export class ExportQueueService {
  constructor(
    @InjectQueue(QUEUES.TRANSLATION_EXPORT)
    private readonly exportQueue: Queue,
  ) {}

  enqueueExport(payload: TranslationExportJobPayload): Promise<void> {
    return this.exportQueue
      .add('export', payload, {
        jobId: `export-${payload.exportJobId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })
      .then(() => undefined);
  }
}
