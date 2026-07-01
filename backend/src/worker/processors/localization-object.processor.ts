import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LocalizationObjectGenerateJobPayload } from '../../shared/constants/job-payloads';
import { QUEUES } from '../../shared/constants/queues';
import { StructureGenerateService } from '../../localization-object/application/services/structure-generate.service';

@Processor(QUEUES.LOCALIZATION_OBJECT_GENERATE)
export class LocalizationObjectGenerateProcessor extends WorkerHost {
  private readonly logger = new Logger(
    LocalizationObjectGenerateProcessor.name,
  );

  constructor(private readonly generateService: StructureGenerateService) {
    super();
  }

  async process(job: Job<LocalizationObjectGenerateJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.LOCALIZATION_OBJECT_GENERATE} for object ${job.data.objectId}`,
    );
    const rootCount = await this.generateService.run(
      job.data.projectId,
      job.data.objectId,
    );
    this.logger.log(`Generated structure with ${rootCount} root nodes`);
  }
}
