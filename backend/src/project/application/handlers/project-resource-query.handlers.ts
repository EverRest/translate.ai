import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../infrastructure/project-access.service';
import {
  ListApiKeysQuery,
  ListProjectLanguagesQuery,
  ListWebhooksQuery,
} from '../queries/project.queries';

@Injectable()
@QueryHandler(ListApiKeysQuery)
export class ListApiKeysHandler implements IQueryHandler<ListApiKeysQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListApiKeysQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const items = await this.prisma.apiKey.findMany({
      where: { projectId: query.projectId, active: true },
      select: { id: true, name: true, active: true },
      orderBy: { name: 'asc' },
    });

    return { items };
  }
}

@Injectable()
@QueryHandler(ListProjectLanguagesQuery)
export class ListProjectLanguagesHandler implements IQueryHandler<ListProjectLanguagesQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListProjectLanguagesQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const items = await this.prisma.projectLanguage.findMany({
      where: { projectId: query.projectId },
      orderBy: { code: 'asc' },
    });

    return { items };
  }
}

@Injectable()
@QueryHandler(ListWebhooksQuery)
export class ListWebhooksHandler implements IQueryHandler<ListWebhooksQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListWebhooksQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const items = await this.prisma.webhook.findMany({
      where: { projectId: query.projectId },
      select: { id: true, url: true, enabled: true },
      orderBy: { url: 'asc' },
    });

    return { items };
  }
}
