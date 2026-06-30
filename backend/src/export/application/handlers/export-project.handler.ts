import { BadRequestException, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AuditService } from '../../../audit/application/audit.service';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { ExportProjectQuery, VALID_EXPORT_FORMATS } from '../export.commands';
import { ExportDataService } from '../export-data.service';
import { ExportFormatService } from '../export-format.service';
import { parseExportStatus } from '../export.utils';

@Injectable()
@QueryHandler(ExportProjectQuery)
export class ExportProjectHandler implements IQueryHandler<ExportProjectQuery> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly exportData: ExportDataService,
    private readonly formatService: ExportFormatService,
    private readonly audit: AuditService,
  ) {}

  async execute(query: ExportProjectQuery) {
    if (!VALID_EXPORT_FORMATS.includes(query.format)) {
      throw new BadRequestException(`Unsupported format: ${query.format}`);
    }

    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const status = parseExportStatus(query.status);

    const rows = await this.exportData.loadExportRows({
      projectId: query.projectId,
      status,
      language: query.language,
    });

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
        async: false,
      },
    });

    return rendered;
  }
}
