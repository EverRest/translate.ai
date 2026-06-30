import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { ExportJobStatus } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RequestExportCommand } from '../export.commands';
import { ExportDataService } from '../export-data.service';
import { ExportJobRunnerService } from '../export-job-runner.service';
import {
  assertExportFormat,
  parseExportStatus,
  toExportJobDto,
} from '../export.utils';
import { ExportQueueService } from '../../infrastructure/export-queue.service';

@Injectable()
@CommandHandler(RequestExportCommand)
export class RequestExportHandler implements ICommandHandler<RequestExportCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly exportData: ExportDataService,
    private readonly exportQueue: ExportQueueService,
    private readonly exportJobRunner: ExportJobRunnerService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: RequestExportCommand) {
    const format = assertExportFormat(command.format);
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const statusFilter = parseExportStatus(command.status);
    const rowCount = await this.exportData.countTranslations({
      projectId: command.projectId,
      status: statusFilter,
      language: command.language,
    });

    const threshold = this.config.get<number>('EXPORT_ASYNC_THRESHOLD', 1000);
    const isAsync = rowCount > threshold;

    const exportJob = await this.prisma.exportJob.create({
      data: {
        tenantId: command.tenantId,
        projectId: command.projectId,
        format,
        language: command.language,
        statusFilter,
        rowCount,
        exportStatus: isAsync
          ? ExportJobStatus.pending
          : ExportJobStatus.processing,
      },
    });

    if (isAsync) {
      await this.exportQueue.enqueueExport({
        exportJobId: exportJob.id,
        tenantId: command.tenantId,
      });
      return toExportJobDto(exportJob, true);
    }

    await this.exportJobRunner.run(exportJob.id);
    const completed = await this.prisma.exportJob.findUniqueOrThrow({
      where: { id: exportJob.id },
    });
    return toExportJobDto(completed, false);
  }
}
