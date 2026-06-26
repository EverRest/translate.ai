import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { BillingModule } from '../billing/billing.module';
import { GlossaryModule } from '../glossary/glossary.module';
import { ProjectModule } from '../project/project.module';
import {
  CancelTranslationJobHandler,
  CreateTranslationJobHandler,
  RetryTranslationJobHandler,
} from './application/handlers/translation-job.handlers';
import {
  GetJobStatusHandler,
  ListTranslationJobsHandler,
} from './application/handlers/translation-job-query.handlers';
import { ListTranslationKeysHandler } from './application/handlers/list-translation-keys.handler';
import {
  CreateTranslationKeyHandler,
  DeleteTranslationKeyHandler,
  UpdateTranslationKeyHandler,
} from './application/handlers/translation-key.handlers';
import {
  GetTranslationHandler,
  ListTranslationsHandler,
  LookupTranslationsHandler,
} from './application/handlers/translation-query.handlers';
import { RecordTranslationQualityHandler } from './application/handlers/record-translation-quality.handler';
import { JobCompletionService } from './application/services/job-completion.service';
import { TranslateTextService } from './application/services/translate-text.service';
import { TranslationJobRunnerService } from './application/services/translation-job-runner.service';
import { TranslationMemoryService } from './application/services/translation-memory.service';
import { TranslationQueueService } from './infrastructure/translation-queue.service';
import { JobsController } from './presentation/jobs.controller';
import { TranslationKeysController } from './presentation/translation-keys.controller';
import { TranslationsController } from './presentation/translations.controller';

const commandHandlers = [
  CreateTranslationJobHandler,
  RetryTranslationJobHandler,
  CancelTranslationJobHandler,
  CreateTranslationKeyHandler,
  UpdateTranslationKeyHandler,
  DeleteTranslationKeyHandler,
  RecordTranslationQualityHandler,
];

const queryHandlers = [
  ListTranslationJobsHandler,
  GetJobStatusHandler,
  ListTranslationKeysHandler,
  ListTranslationsHandler,
  GetTranslationHandler,
  LookupTranslationsHandler,
];

const services = [
  TranslationQueueService,
  TranslationMemoryService,
  TranslateTextService,
  JobCompletionService,
  TranslationJobRunnerService,
];

@Module({
  imports: [
    CqrsModule,
    ProjectModule,
    AiProviderModule,
    BillingModule,
    GlossaryModule,
  ],
  controllers: [
    JobsController,
    TranslationKeysController,
    TranslationsController,
  ],
  providers: [...commandHandlers, ...queryHandlers, ...services],
  exports: [...services, TranslationQueueService],
})
export class TranslationModule {}
