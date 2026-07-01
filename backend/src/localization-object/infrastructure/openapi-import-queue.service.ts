import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';

export interface OpenApiImportJobPayload {
  tenantId: string;
  projectId: string;
  collectionId: string;
  spec: string;
  selectedTags?: string[];
  materialize: boolean;
}

@Injectable()
export class OpenApiImportQueueService {
  constructor(
    @InjectQueue(QUEUES.INTEGRATION_OPENAPI_IMPORT)
    private readonly queue: Queue<OpenApiImportJobPayload>,
  ) {}

  async enqueue(payload: OpenApiImportJobPayload): Promise<void> {
    await this.queue.add('import', payload, {
      jobId: `openapi-import-${payload.projectId}-${Date.now()}`,
    });
  }
}
