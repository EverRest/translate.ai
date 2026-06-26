import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../infrastructure/project-access.service';
import { GetProjectQuery, ListProjectsQuery } from '../queries/project.queries';
import { ProjectResponseDto } from '../../presentation/dto/project.dto';

@Injectable()
@QueryHandler(ListProjectsQuery)
export class ListProjectsHandler implements IQueryHandler<ListProjectsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListProjectsQuery) {
    const where = {
      tenantId: query.tenantId,
      status: ProjectStatus.active,
    };
    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map((p) => ProjectResponseDto.from(p)),
      meta: { page: query.page, limit: query.limit, total },
    };
  }
}

@Injectable()
@QueryHandler(GetProjectQuery)
export class GetProjectHandler implements IQueryHandler<GetProjectQuery> {
  constructor(private readonly projectAccess: ProjectAccessService) {}

  async execute(query: GetProjectQuery) {
    const project = await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    return ProjectResponseDto.from(project);
  }
}
