import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import {
  ConfluenceSyncJobRunnerService,
  type ConfluenceSyncJobPayload,
} from '../../integration/application/confluence-sync-job-runner.service';

@Processor(QUEUES.INTEGRATION_CONFLUENCE_SYNC)
export class ConfluenceSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ConfluenceSyncProcessor.name);

  constructor(private readonly runner: ConfluenceSyncJobRunnerService) {
    super();
  }

  async process(job: Job<ConfluenceSyncJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.INTEGRATION_CONFLUENCE_SYNC} session ${job.data.sessionId}`,
    );
    await this.runner.run(job.data);
  }
}
