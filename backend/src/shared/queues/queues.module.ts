import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { QUEUES } from '../constants/queues';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUES.TRANSLATION_CREATE },
      { name: QUEUES.TRANSLATION_PROCESS },
      { name: QUEUES.TRANSLATION_RETRY },
      { name: QUEUES.TRANSLATION_REVIEW },
      { name: QUEUES.TRANSLATION_EXPORT },
      { name: QUEUES.WEBHOOK_SEND },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
