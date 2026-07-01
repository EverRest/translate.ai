import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import {
  GetStaleTranslationKeyHintsQuery,
  GetStaleTranslationSummaryQuery,
} from '../stale-translation.queries';
import { StaleTranslationService } from '../services/stale-translation.service';

@Injectable()
@QueryHandler(GetStaleTranslationSummaryQuery)
export class GetStaleTranslationSummaryHandler implements IQueryHandler<GetStaleTranslationSummaryQuery> {
  constructor(
    private readonly staleService: StaleTranslationService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: GetStaleTranslationSummaryQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    return this.staleService.getStaleSummary(query.projectId);
  }
}

@Injectable()
@QueryHandler(GetStaleTranslationKeyHintsQuery)
export class GetStaleTranslationKeyHintsHandler implements IQueryHandler<GetStaleTranslationKeyHintsQuery> {
  constructor(
    private readonly staleService: StaleTranslationService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: GetStaleTranslationKeyHintsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    const keyIds = await this.staleService.getStaleKeyIds(query.projectId);
    return { keyIds };
  }
}
