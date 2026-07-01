import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { GetCoverageMatrixQuery } from '../coverage-matrix.queries';
import { CoverageMatrixService } from '../services/coverage-matrix.service';

@Injectable()
@QueryHandler(GetCoverageMatrixQuery)
export class GetCoverageMatrixHandler implements IQueryHandler<GetCoverageMatrixQuery> {
  constructor(
    private readonly coverage: CoverageMatrixService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: GetCoverageMatrixQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    return this.coverage.getCoverageMatrix(query.projectId, {
      scopes: query.scopes,
      languages: query.languages,
    });
  }
}
