import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExportJobStatus } from '@prisma/client';
import { AuditService } from '../../audit/application/audit.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ExportDataService } from './export-data.service';
import { ExportFormat } from './export.commands';
import { ExportFormatService } from './export-format.service';
import { ExportStorageService } from '../infrastructure/export-storage.service';

@Injectable()
export class ExportJobRunnerService {
  private readonly logger = new Logger(ExportJobRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exportData: ExportDataService,
    private readonly formatService: ExportFormatService,
    private readonly storage: ExportStorageService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async run(exportJobId: string): Promise<void> {
    const job = await this.prisma.exportJob.findUnique({
      where: { id: exportJobId },
    });
    if (!job || job.exportStatus === ExportJobStatus.completed) {
      return;
    }

    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: { exportStatus: ExportJobStatus.processing },
    });

    try {
      const rows = await this.exportData.loadExportRows({
        projectId: job.projectId,
        status: job.statusFilter,
        language: job.language ?? undefined,
      });

      const rendered = this.formatService.render(
        job.format as ExportFormat,
        rows,
        job.language ?? undefined,
      );

      const storagePath = await this.storage.writeExportFile(
        job.tenantId,
        exportJobId,
        rendered.filename,
        rendered.content,
      );

      const ttlHours = this.config.get<number>('EXPORT_JOB_TTL_HOURS', 24);
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: {
          exportStatus: ExportJobStatus.completed,
          rowCount: rows.length,
          filename: rendered.filename,
          contentType: rendered.contentType,
          storagePath,
          completedAt: new Date(),
          expiresAt,
          errorMessage: null,
        },
      });

      await this.audit.log({
        tenantId: job.tenantId,
        entity: 'project',
        entityId: job.projectId,
        action: 'export',
        payload: {
          exportJobId,
          format: job.format,
          language: job.language,
          status: job.statusFilter,
          count: rows.length,
          async:
            job.rowCount >
            this.config.get<number>('EXPORT_ASYNC_THRESHOLD', 1000),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Export job failed';
      this.logger.error(`Export job ${exportJobId} failed: ${message}`);
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: {
          exportStatus: ExportJobStatus.failed,
          errorMessage: message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }
}
