import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { TranslationStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { AuditService } from '../../../audit/application/audit.service';
import {
  ExportFormat,
  ExportProjectQuery,
  ExportRow,
} from '../export.commands';
import { ExportFormatService } from '../export-format.service';

const VALID_FORMATS: ExportFormat[] = [
  'json',
  'yaml',
  'csv',
  'android-xml',
  'ios-strings',
  'po',
];

const VALID_STATUSES = Object.values(TranslationStatus);

@Injectable()
@QueryHandler(ExportProjectQuery)
export class ExportProjectHandler implements IQueryHandler<ExportProjectQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly formatService: ExportFormatService,
    private readonly audit: AuditService,
  ) {}

  async execute(query: ExportProjectQuery) {
    if (!VALID_FORMATS.includes(query.format)) {
      throw new BadRequestException(`Unsupported format: ${query.format}`);
    }

    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const status = query.status
      ? (query.status as TranslationStatus)
      : TranslationStatus.published;

    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status: ${query.status}`);
    }

    const translations = await this.prisma.translation.findMany({
      where: {
        status,
        translationKey: { projectId: query.projectId },
        ...(query.language ? { language: query.language } : {}),
      },
      include: {
        translationKey: { select: { key: true } },
      },
      orderBy: [{ translationKey: { key: 'asc' } }, { language: 'asc' }],
    });

    const rows: ExportRow[] = translations.map((t) => ({
      key: t.translationKey.key,
      language: t.language,
      value: t.value,
    }));

    const rendered = this.formatService.render(
      query.format,
      rows,
      query.language,
    );

    await this.audit.log({
      tenantId: query.tenantId,
      entity: 'project',
      entityId: query.projectId,
      action: 'export',
      payload: {
        format: query.format,
        language: query.language,
        status,
        count: rows.length,
      },
    });

    return rendered;
  }
}
