import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';

export interface ExcelParseJobPayload {
  sessionId: string;
  tenantId: string;
}

export interface ExcelComposeJobPayload {
  sessionId: string;
  tenantId: string;
}

@Injectable()
export class ExcelQueueService {
  constructor(
    @InjectQueue(QUEUES.INTEGRATION_EXCEL_PARSE)
    private readonly parseQueue: Queue<ExcelParseJobPayload>,
    @InjectQueue(QUEUES.INTEGRATION_EXCEL_COMPOSE)
    private readonly composeQueue: Queue<ExcelComposeJobPayload>,
  ) {}

  enqueueParse(payload: ExcelParseJobPayload): Promise<void> {
    return this.parseQueue
      .add('parse', payload, {
        jobId: `excel-parse-${payload.sessionId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      })
      .then(() => undefined);
  }

  enqueueCompose(payload: ExcelComposeJobPayload): Promise<void> {
    return this.composeQueue
      .add('compose', payload, {
        jobId: `excel-compose-${payload.sessionId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      })
      .then(() => undefined);
  }
}
