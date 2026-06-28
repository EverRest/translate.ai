import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { TranslationExportJobPayload } from '../../shared/constants/job-payloads';
import { ExportJobRunnerService } from '../../export/application/export-job-runner.service';

@Processor(QUEUES.TRANSLATION_EXPORT)
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(private readonly exportJobRunner: ExportJobRunnerService) {
    super();
  }

  async process(job: Job<TranslationExportJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.TRANSLATION_EXPORT} job ${job.data.exportJobId}`,
    );
    await this.exportJobRunner.run(job.data.exportJobId);
  }
}
