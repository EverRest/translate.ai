import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportJobStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { DownloadExportJobQuery } from '../export.commands';
import { ExportStorageService } from '../../infrastructure/export-storage.service';

@Injectable()
@QueryHandler(DownloadExportJobQuery)
export class DownloadExportJobHandler implements IQueryHandler<DownloadExportJobQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ExportStorageService,
  ) {}

  async execute(query: DownloadExportJobQuery) {
    const job = await this.prisma.exportJob.findFirst({
      where: {
        id: query.exportJobId,
        tenantId: query.tenantId,
      },
    });

    if (!job) {
      throw new NotFoundException('Export job not found');
    }

    if (job.exportStatus !== ExportJobStatus.completed) {
      throw new NotFoundException('Export is not ready');
    }

    if (job.expiresAt && job.expiresAt.getTime() < Date.now()) {
      throw new GoneException('Export file has expired');
    }

    if (!job.storagePath || !job.filename || !job.contentType) {
      throw new NotFoundException('Export file is missing');
    }

    const content = await this.storage.readExportFile(job.storagePath);

    return {
      content,
      contentType: job.contentType,
      filename: job.filename,
    };
  }
}
