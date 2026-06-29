import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';
import { Roles } from '../shared/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { QUEUES } from '../shared/constants/queues';

@ApiTags('admin')
@Roles(UserRole.admin)
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @InjectQueue(QUEUES.TRANSLATION_CREATE) private readonly createQueue: Queue,
    @InjectQueue(QUEUES.TRANSLATION_PROCESS)
    private readonly processQueue: Queue,
    @InjectQueue(QUEUES.TRANSLATION_RETRY) private readonly retryQueue: Queue,
    @InjectQueue(QUEUES.TRANSLATION_REVIEW) private readonly reviewQueue: Queue,
    @InjectQueue(QUEUES.TRANSLATION_EXPORT) private readonly exportQueue: Queue,
  ) {}

  @Delete('queues/purge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Purge all translation queues (waiting, delayed, failed, completed)',
  })
  async purgeQueues() {
    const queues = [
      { name: QUEUES.TRANSLATION_CREATE, queue: this.createQueue },
      { name: QUEUES.TRANSLATION_PROCESS, queue: this.processQueue },
      { name: QUEUES.TRANSLATION_RETRY, queue: this.retryQueue },
      { name: QUEUES.TRANSLATION_REVIEW, queue: this.reviewQueue },
      { name: QUEUES.TRANSLATION_EXPORT, queue: this.exportQueue },
    ];

    const results: Record<string, number> = {};

    for (const { name, queue } of queues) {
      try {
        const [waiting, delayed, failed, completed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getDelayedCount(),
          queue.getFailedCount(),
          queue.getCompletedCount(),
        ]);
        const total = waiting + delayed + failed + completed;

        await queue.drain();
        await queue.clean(0, 1_000_000, 'failed');
        await queue.clean(0, 1_000_000, 'completed');

        results[name] = total;
        this.logger.log(`Purged queue ${name}: ${total} jobs removed`);
      } catch (err) {
        this.logger.error(`Failed to purge queue ${name}`, err);
        results[name] = -1;
      }
    }

    return { purged: results };
  }
}
