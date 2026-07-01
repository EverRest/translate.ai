import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { ImportJobRunnerService } from '../../integration/application/import-job-runner.service';
import type {
  ImportApplyJobPayload,
  ImportParseJobPayload,
} from '../../integration/infrastructure/import-queue.service';

@Processor(QUEUES.INTEGRATION_IMPORT_PARSE)
export class ImportParseProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportParseProcessor.name);

  constructor(private readonly importJobRunner: ImportJobRunnerService) {
    super();
  }

  async process(job: Job<ImportParseJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.INTEGRATION_IMPORT_PARSE} for session ${job.data.sessionId}`,
    );
    await this.importJobRunner.runParse(job.data.sessionId);
  }
}

@Processor(QUEUES.INTEGRATION_IMPORT_APPLY)
export class ImportApplyProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportApplyProcessor.name);

  constructor(private readonly importJobRunner: ImportJobRunnerService) {
    super();
  }

  async process(job: Job<ImportApplyJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.INTEGRATION_IMPORT_APPLY} for session ${job.data.sessionId}`,
    );
    await this.importJobRunner.runApply(
      job.data.sessionId,
      job.data.conflictStrategy ?? 'update',
    );
  }
}
