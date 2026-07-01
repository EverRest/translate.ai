import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { TerminologyScanJobPayload } from '../../shared/constants/job-payloads';
import { TerminologyDriftService } from '../../glossary/application/terminology-drift.service';

@Processor(QUEUES.TERMINOLOGY_SCAN)
export class TerminologyScanProcessor extends WorkerHost {
  private readonly logger = new Logger(TerminologyScanProcessor.name);

  constructor(private readonly driftService: TerminologyDriftService) {
    super();
  }

  async process(job: Job<TerminologyScanJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.TERMINOLOGY_SCAN} for project ${job.data.projectId}`,
    );
    const count = await this.driftService.runScan(job.data.projectId);
    this.logger.log(`Detected ${count} terminology drift issue(s)`);
  }
}
