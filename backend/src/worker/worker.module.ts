import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { AuditModule } from '../audit/audit.module';
import { MonitoringModule } from '../shared/monitoring/monitoring.module';
import { QueuesModule } from '../shared/queues/queues.module';
import { SharedModule } from '../shared/shared.module';
import { validationSchema } from '../shared/config/validation.schema';
import { buildBullRootConfig } from '../shared/config/bull-root.config';
import { TranslationModule } from '../translation/translation.module';
import { ExportModule } from '../export/export.module';
import { IntegrationModule } from '../integration/integration.module';
import { GlossaryModule } from '../glossary/glossary.module';
import { LocalizationObjectModule } from '../localization-object/localization-object.module';
import { WebhookModule } from '../webhook/webhook.module';
import {
  TranslationCreateProcessor,
  TranslationProcessProcessor,
  TranslationRetryProcessor,
  WebhookSendProcessor,
} from './processors/translation.processor';
import { ExportProcessor } from './processors/export.processor';
import { GlossaryAnalyzeProcessor } from './processors/glossary.processor';
import { LocalizationObjectGenerateProcessor } from './processors/localization-object.processor';
import { OpenApiImportProcessor } from './processors/openapi-import.processor';
import {
  ImportApplyProcessor,
  ImportParseProcessor,
} from './processors/import.processor';
import { ConfluenceSyncProcessor } from './processors/confluence-sync.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    CqrsModule,
    SharedModule,
    MonitoringModule,
    AuditModule,
    AiProviderModule,
    TranslationModule,
    WebhookModule,
    ExportModule,
    IntegrationModule,
    GlossaryModule,
    LocalizationObjectModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildBullRootConfig(config),
    }),
    QueuesModule,
  ],
  providers: [
    TranslationCreateProcessor,
    TranslationProcessProcessor,
    TranslationRetryProcessor,
    WebhookSendProcessor,
    ExportProcessor,
    GlossaryAnalyzeProcessor,
    LocalizationObjectGenerateProcessor,
    OpenApiImportProcessor,
    ImportParseProcessor,
    ImportApplyProcessor,
    ConfluenceSyncProcessor,
  ],
})
export class WorkerModule {}
