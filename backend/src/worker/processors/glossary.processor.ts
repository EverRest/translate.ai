import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { GlossaryAnalyzeJobPayload } from '../../shared/constants/job-payloads';
import { GlossaryAnalyzeService } from '../../glossary/application/glossary-analyze.service';

@Processor(QUEUES.GLOSSARY_ANALYZE)
export class GlossaryAnalyzeProcessor extends WorkerHost {
  private readonly logger = new Logger(GlossaryAnalyzeProcessor.name);

  constructor(private readonly analyzeService: GlossaryAnalyzeService) {
    super();
  }

  async process(job: Job<GlossaryAnalyzeJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.GLOSSARY_ANALYZE} for project ${job.data.projectId}`,
    );
    const created = await this.analyzeService.run(job.data.projectId);
    this.logger.log(`Created ${created} glossary suggestions`);
  }
}
