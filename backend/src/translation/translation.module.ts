import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { BillingModule } from '../billing/billing.module';
import { GlossaryModule } from '../glossary/glossary.module';
import { MonitoringModule } from '../shared/monitoring/monitoring.module';
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
import { EmbedJobRunnerService } from './application/services/embed-job-runner.service';
import { JobCompletionService } from './application/services/job-completion.service';
import { MemoryHitService } from './application/services/memory-hit.service';
import { SemanticMemoryService } from './application/services/semantic-memory.service';
import { TranslationSseService } from './application/services/translation-sse.service';
import { TranslateTextService } from './application/services/translate-text.service';
import { TranslationJobRunnerService } from './application/services/translation-job-runner.service';
import { TranslationOutputValidator } from './application/services/translation-output.validator';
import { TranslationMemoryService } from './application/services/translation-memory.service';
import { EmbedQueueService } from './infrastructure/embed-queue.service';
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
  EmbedQueueService,
  TranslationMemoryService,
  SemanticMemoryService,
  MemoryHitService,
  EmbedJobRunnerService,
  TranslateTextService,
  JobCompletionService,
  TranslationJobRunnerService,
  TranslationOutputValidator,
  TranslationSseService,
];

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    ProjectModule,
    AiProviderModule,
    BillingModule,
    GlossaryModule,
    MonitoringModule,
  ],
  controllers: [
    JobsController,
    TranslationKeysController,
    TranslationsController,
  ],
  providers: [...commandHandlers, ...queryHandlers, ...services],
  exports: [
    ...services,
    TranslationQueueService,
    TranslationMemoryService,
    EmbedJobRunnerService,
  ],
})
export class TranslationModule {}
