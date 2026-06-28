import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuditModule } from '../audit/audit.module';
import { ProjectModule } from '../project/project.module';
import { ExportDataService } from './application/export-data.service';
import { ExportFormatService } from './application/export-format.service';
import { ExportJobRunnerService } from './application/export-job-runner.service';
import { DownloadExportJobHandler } from './application/handlers/download-export-job.handler';
import { ExportProjectHandler } from './application/handlers/export-project.handler';
import { GetExportJobHandler } from './application/handlers/get-export-job.handler';
import { RequestExportHandler } from './application/handlers/request-export.handler';
import { ExportQueueService } from './infrastructure/export-queue.service';
import { ExportStorageService } from './infrastructure/export-storage.service';
import { ExportController } from './presentation/export.controller';

@Module({
  imports: [CqrsModule, ProjectModule, AuditModule],
  controllers: [ExportController],
  providers: [
    ExportFormatService,
    ExportDataService,
    ExportStorageService,
    ExportQueueService,
    ExportJobRunnerService,
    ExportProjectHandler,
    RequestExportHandler,
    GetExportJobHandler,
    DownloadExportJobHandler,
  ],
  exports: [ExportJobRunnerService, ExportFormatService, ExportDataService],
})
export class ExportModule {}
