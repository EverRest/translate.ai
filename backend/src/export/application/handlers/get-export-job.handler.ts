import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { GetExportJobQuery } from '../export.commands';
import { toExportJobDto } from '../export.utils';

@Injectable()
@QueryHandler(GetExportJobQuery)
export class GetExportJobHandler implements IQueryHandler<GetExportJobQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async execute(query: GetExportJobQuery) {
    const job = await this.prisma.exportJob.findFirst({
      where: {
        id: query.exportJobId,
        tenantId: query.tenantId,
      },
    });

    if (!job) {
      throw new NotFoundException('Export job not found');
    }

    const threshold = this.config.get<number>('EXPORT_ASYNC_THRESHOLD', 1000);
    return toExportJobDto(job, job.rowCount > threshold);
  }
}
