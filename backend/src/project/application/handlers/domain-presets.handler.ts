import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ProjectAccessService } from '../../infrastructure/project-access.service';
import { ListDomainPresetsQuery } from '../queries/project.queries';
import { DOMAIN_PRESETS } from '../../../shared/domain/domain-presets';

@Injectable()
@QueryHandler(ListDomainPresetsQuery)
export class ListDomainPresetsHandler implements IQueryHandler<ListDomainPresetsQuery> {
  constructor(private readonly projectAccess: ProjectAccessService) {}

  async execute(query: ListDomainPresetsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    return {
      items: DOMAIN_PRESETS.map((preset) => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        profile: preset.profile,
        glossaryPresetId: preset.glossaryPresetId ?? null,
      })),
    };
  }
}
