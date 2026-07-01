import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import { ExcelComposeService } from '../../integration/application/excel-compose.service';
import { ExcelJobRunnerService } from '../../integration/application/excel-job-runner.service';
import type {
  ExcelComposeJobPayload,
  ExcelParseJobPayload,
} from '../../integration/infrastructure/excel-queue.service';

@Processor(QUEUES.INTEGRATION_EXCEL_PARSE)
export class ExcelParseProcessor extends WorkerHost {
  private readonly logger = new Logger(ExcelParseProcessor.name);

  constructor(private readonly excelJobRunner: ExcelJobRunnerService) {
    super();
  }

  async process(job: Job<ExcelParseJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.INTEGRATION_EXCEL_PARSE} for session ${job.data.sessionId}`,
    );
    await this.excelJobRunner.runParse(job.data.sessionId);
  }
}

@Processor(QUEUES.INTEGRATION_EXCEL_COMPOSE)
export class ExcelComposeProcessor extends WorkerHost {
  private readonly logger = new Logger(ExcelComposeProcessor.name);

  constructor(private readonly excelCompose: ExcelComposeService) {
    super();
  }

  async process(job: Job<ExcelComposeJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.INTEGRATION_EXCEL_COMPOSE} for session ${job.data.sessionId}`,
    );
    await this.excelCompose.composeSession(job.data.sessionId);
  }
}
