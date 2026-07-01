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
      { name: QUEUES.GLOSSARY_ANALYZE },
      { name: QUEUES.TERMINOLOGY_SCAN },
      { name: QUEUES.LOCALIZATION_OBJECT_GENERATE },
      { name: QUEUES.INTEGRATION_OPENAPI_IMPORT },
      { name: QUEUES.INTEGRATION_IMPORT_PARSE },
      { name: QUEUES.INTEGRATION_IMPORT_APPLY },
      { name: QUEUES.INTEGRATION_CONFLUENCE_SYNC },
      { name: QUEUES.WEBHOOK_SEND },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
