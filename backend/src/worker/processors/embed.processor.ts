import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { TranslationEmbedJobPayload } from '../../shared/constants/job-payloads';
import { EmbedJobRunnerService } from '../../translation/application/services/embed-job-runner.service';

@Processor(QUEUES.TRANSLATION_EMBED)
export class EmbedProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbedProcessor.name);

  constructor(private readonly embedJobRunner: EmbedJobRunnerService) {
    super();
  }

  async process(job: Job<TranslationEmbedJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.TRANSLATION_EMBED} job ${job.id ?? 'unknown'}`,
    );
    await this.embedJobRunner.run(job.data);
  }
}
