import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { AuditModule } from '../audit/audit.module';
import { ProjectModule } from '../project/project.module';
import { TranslationModule } from '../translation/translation.module';
import { ImportApplyService } from './application/import-apply.service';
import { ImportDiffService } from './application/import-diff.service';
import { ImportJobRunnerService } from './application/import-job-runner.service';
import { ExcelComposeService } from './application/excel-compose.service';
import { ExcelDeltaTranslateService } from './application/excel-delta-translate.service';
import { ExcelJobRunnerService } from './application/excel-job-runner.service';
import { ConfluenceFetchService } from './application/confluence-fetch.service';
import { ConfluenceOAuthService } from './application/confluence-oauth.service';
import { ConfluenceSyncJobRunnerService } from './application/confluence-sync-job-runner.service';
import { ConfluenceSyncTriggerService } from './application/confluence-sync-trigger.service';
import { TenantAtlassianOAuthService } from './application/tenant-atlassian-oauth.service';
import {
  ApplyImportSessionHandler,
  CreateImportSessionHandler,
  GetImportSessionHandler,
  ListImportSessionsHandler,
  PreviewImportSessionHandler,
} from './application/handlers/import.handlers';
import {
  DeltaTranslateExcelImportHandler,
  DownloadExcelImportHandler,
  ExcelComposeOnJobCompletedHandler,
  GetExcelImportProfileHandler,
  GetExcelImportSessionHandler,
  PreviewExcelImportHandler,
  SaveExcelImportProfileHandler,
} from './application/handlers/excel.handlers';
import {
  CompleteConfluenceConnectHandler,
  DeleteTenantAtlassianOAuthHandler,
  DisconnectConfluenceHandler,
  GetConfluenceConnectUrlHandler,
  GetConfluenceIntegrationHandler,
  GetConfluencePendingSitesHandler,
  GetTenantAtlassianOAuthHandler,
  ListConfluencePagesHandler,
  ListConfluenceSpacesHandler,
  TriggerConfluenceSyncHandler,
  UpdateConfluenceSyncConfigHandler,
  UpsertTenantAtlassianOAuthHandler,
} from './application/handlers/confluence.handlers';
import { AtlassianOAuthCredentialsService } from './infrastructure/atlassian-oauth-credentials.service';
import { ConfluenceApiClient } from './infrastructure/confluence-api.client';
import { ConfluenceSyncQueueService } from './infrastructure/confluence-sync-queue.service';
import { ImportQueueService } from './infrastructure/import-queue.service';
import { ExcelQueueService } from './infrastructure/excel-queue.service';
import { ImportStorageService } from './infrastructure/import-storage.service';
import { TokenEncryptionService } from './infrastructure/token-encryption.service';
import {
  ConfluenceController,
  TenantAtlassianOAuthController,
} from './presentation/confluence.controller';
import { ImportController } from './presentation/import.controller';
import { ExcelImportController } from './presentation/excel-import.controller';

@Module({
  imports: [
    CqrsModule,
    ProjectModule,
    TranslationModule,
    AuditModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [
    ImportController,
    ExcelImportController,
    ConfluenceController,
    TenantAtlassianOAuthController,
  ],
  providers: [
    ImportStorageService,
    ImportQueueService,
    ExcelQueueService,
    ConfluenceSyncQueueService,
    TokenEncryptionService,
    AtlassianOAuthCredentialsService,
    ConfluenceApiClient,
    ConfluenceOAuthService,
    ConfluenceFetchService,
    ConfluenceSyncJobRunnerService,
    ConfluenceSyncTriggerService,
    TenantAtlassianOAuthService,
    ImportDiffService,
    ImportApplyService,
    ImportJobRunnerService,
    ExcelJobRunnerService,
    ExcelComposeService,
    ExcelDeltaTranslateService,
    CreateImportSessionHandler,
    ApplyImportSessionHandler,
    GetImportSessionHandler,
    ListImportSessionsHandler,
    PreviewImportSessionHandler,
    PreviewExcelImportHandler,
    DeltaTranslateExcelImportHandler,
    DownloadExcelImportHandler,
    GetExcelImportSessionHandler,
    GetExcelImportProfileHandler,
    SaveExcelImportProfileHandler,
    ExcelComposeOnJobCompletedHandler,
    GetConfluenceConnectUrlHandler,
    GetConfluencePendingSitesHandler,
    CompleteConfluenceConnectHandler,
    GetConfluenceIntegrationHandler,
    UpdateConfluenceSyncConfigHandler,
    ListConfluenceSpacesHandler,
    ListConfluencePagesHandler,
    TriggerConfluenceSyncHandler,
    DisconnectConfluenceHandler,
    GetTenantAtlassianOAuthHandler,
    UpsertTenantAtlassianOAuthHandler,
    DeleteTenantAtlassianOAuthHandler,
  ],
  exports: [
    ImportJobRunnerService,
    ImportStorageService,
    ExcelJobRunnerService,
    ExcelComposeService,
    ConfluenceSyncJobRunnerService,
    ConfluenceSyncTriggerService,
    AtlassianOAuthCredentialsService,
  ],
})
export class IntegrationModule {}
