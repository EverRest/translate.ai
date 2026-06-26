import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from '../constants/queues';
import { MetricsService } from './metrics.service';

@Injectable()
export class QueueMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueMetricsService.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly metrics: MetricsService,
    @InjectQueue(QUEUES.TRANSLATION_CREATE)
    private readonly translationCreate: Queue,
    @InjectQueue(QUEUES.TRANSLATION_PROCESS)
    private readonly translationProcess: Queue,
    @InjectQueue(QUEUES.TRANSLATION_RETRY)
    private readonly translationRetry: Queue,
    @InjectQueue(QUEUES.TRANSLATION_REVIEW)
    private readonly translationReview: Queue,
    @InjectQueue(QUEUES.TRANSLATION_EXPORT)
    private readonly translationExport: Queue,
    @InjectQueue(QUEUES.WEBHOOK_SEND) private readonly webhookSend: Queue,
  ) {}

  onModuleInit(): void {
    void this.refresh();
    this.timer = setInterval(() => {
      void this.refresh();
    }, 15_000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async refresh(): Promise<void> {
    const queues: Array<{ name: string; queue: Queue }> = [
      { name: QUEUES.TRANSLATION_CREATE, queue: this.translationCreate },
      { name: QUEUES.TRANSLATION_PROCESS, queue: this.translationProcess },
      { name: QUEUES.TRANSLATION_RETRY, queue: this.translationRetry },
      { name: QUEUES.TRANSLATION_REVIEW, queue: this.translationReview },
      { name: QUEUES.TRANSLATION_EXPORT, queue: this.translationExport },
      { name: QUEUES.WEBHOOK_SEND, queue: this.webhookSend },
    ];

    for (const { name, queue } of queues) {
      try {
        const counts = await queue.getJobCounts('waiting', 'active', 'failed');
        this.metrics.setQueueDepth(
          name,
          counts.waiting ?? 0,
          counts.active ?? 0,
          counts.failed ?? 0,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to collect queue metrics for ${name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
