import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { AuditModule } from '../audit/audit.module';
import { ProjectModule } from '../project/project.module';
import { ImportApplyService } from './application/import-apply.service';
import { ImportDiffService } from './application/import-diff.service';
import { ImportJobRunnerService } from './application/import-job-runner.service';
import { ConfluenceFetchService } from './application/confluence-fetch.service';
import { ConfluenceOAuthService } from './application/confluence-oauth.service';
import { ConfluenceSyncJobRunnerService } from './application/confluence-sync-job-runner.service';
import {
  ApplyImportSessionHandler,
  CreateImportSessionHandler,
  GetImportSessionHandler,
  ListImportSessionsHandler,
  PreviewImportSessionHandler,
} from './application/handlers/import.handlers';
import {
  DisconnectConfluenceHandler,
  GetConfluenceConnectUrlHandler,
  GetConfluenceIntegrationHandler,
  ListConfluencePagesHandler,
  ListConfluenceSpacesHandler,
  TriggerConfluenceSyncHandler,
  UpdateConfluenceSyncConfigHandler,
} from './application/handlers/confluence.handlers';
import { ConfluenceApiClient } from './infrastructure/confluence-api.client';
import { ConfluenceSyncQueueService } from './infrastructure/confluence-sync-queue.service';
import { ImportQueueService } from './infrastructure/import-queue.service';
import { ImportStorageService } from './infrastructure/import-storage.service';
import { TokenEncryptionService } from './infrastructure/token-encryption.service';
import { ConfluenceController } from './presentation/confluence.controller';
import { ImportController } from './presentation/import.controller';

@Module({
  imports: [
    CqrsModule,
    ProjectModule,
    AuditModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [ImportController, ConfluenceController],
  providers: [
    ImportStorageService,
    ImportQueueService,
    ConfluenceSyncQueueService,
    TokenEncryptionService,
    ConfluenceApiClient,
    ConfluenceOAuthService,
    ConfluenceFetchService,
    ConfluenceSyncJobRunnerService,
    ImportDiffService,
    ImportApplyService,
    ImportJobRunnerService,
    CreateImportSessionHandler,
    ApplyImportSessionHandler,
    GetImportSessionHandler,
    ListImportSessionsHandler,
    PreviewImportSessionHandler,
    GetConfluenceConnectUrlHandler,
    GetConfluenceIntegrationHandler,
    UpdateConfluenceSyncConfigHandler,
    ListConfluenceSpacesHandler,
    ListConfluencePagesHandler,
    TriggerConfluenceSyncHandler,
    DisconnectConfluenceHandler,
  ],
  exports: [
    ImportJobRunnerService,
    ImportStorageService,
    ConfluenceSyncJobRunnerService,
  ],
})
export class IntegrationModule {}
