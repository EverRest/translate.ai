import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuditModule } from '../audit/audit.module';
import { ProjectModule } from '../project/project.module';
import { ImportApplyService } from './application/import-apply.service';
import { ImportDiffService } from './application/import-diff.service';
import { ImportJobRunnerService } from './application/import-job-runner.service';
import {
  ApplyImportSessionHandler,
  CreateImportSessionHandler,
  GetImportSessionHandler,
  ListImportSessionsHandler,
  PreviewImportSessionHandler,
} from './application/handlers/import.handlers';
import { ImportQueueService } from './infrastructure/import-queue.service';
import { ImportStorageService } from './infrastructure/import-storage.service';
import { ImportController } from './presentation/import.controller';

@Module({
  imports: [CqrsModule, ProjectModule, AuditModule],
  controllers: [ImportController],
  providers: [
    ImportStorageService,
    ImportQueueService,
    ImportDiffService,
    ImportApplyService,
    ImportJobRunnerService,
    CreateImportSessionHandler,
    ApplyImportSessionHandler,
    GetImportSessionHandler,
    ListImportSessionsHandler,
    PreviewImportSessionHandler,
  ],
  exports: [ImportJobRunnerService, ImportStorageService],
})
export class IntegrationModule {}
