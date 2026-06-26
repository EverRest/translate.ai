import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../shared/constants/queues';
import {
  TranslationCreateJobPayload,
  TranslationProcessJobPayload,
  TranslationRetryJobPayload,
  WebhookSendJobPayload,
} from '../../shared/constants/job-payloads';
import { TranslationJobRunnerService } from '../../translation/application/services/translation-job-runner.service';
import { WebhookDeliveryService } from '../../webhook/application/webhook-delivery.service';

@Processor(QUEUES.TRANSLATION_CREATE)
export class TranslationCreateProcessor extends WorkerHost {
  private readonly logger = new Logger(TranslationCreateProcessor.name);

  constructor(private readonly jobRunner: TranslationJobRunnerService) {
    super();
  }

  async process(job: Job<TranslationCreateJobPayload>): Promise<void> {
    this.logger.log(`Processing ${QUEUES.TRANSLATION_CREATE} job ${job.id}`);
    await this.jobRunner.handleCreate(job.data);
  }
}

@Processor(QUEUES.TRANSLATION_PROCESS)
export class TranslationProcessProcessor extends WorkerHost {
  private readonly logger = new Logger(TranslationProcessProcessor.name);

  constructor(private readonly jobRunner: TranslationJobRunnerService) {
    super();
  }

  async process(job: Job<TranslationProcessJobPayload>): Promise<void> {
    this.logger.log(`Processing ${QUEUES.TRANSLATION_PROCESS} job ${job.id}`);
    await this.jobRunner.handleProcess(job.data);
  }
}

@Processor(QUEUES.TRANSLATION_RETRY)
export class TranslationRetryProcessor extends WorkerHost {
  private readonly logger = new Logger(TranslationRetryProcessor.name);

  constructor(private readonly jobRunner: TranslationJobRunnerService) {
    super();
  }

  async process(job: Job<TranslationRetryJobPayload>): Promise<void> {
    this.logger.log(`Processing ${QUEUES.TRANSLATION_RETRY} job ${job.id}`);
    await this.jobRunner.handleRetry(job.data);
  }
}

@Processor(QUEUES.WEBHOOK_SEND)
export class WebhookSendProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookSendProcessor.name);

  constructor(private readonly delivery: WebhookDeliveryService) {
    super();
  }

  async process(job: Job<WebhookSendJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ${QUEUES.WEBHOOK_SEND} ${job.data.event} → webhook ${job.data.webhookId}`,
    );
    await this.delivery.deliver(job.data);
  }
}
