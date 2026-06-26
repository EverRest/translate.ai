import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { ListTranslationKeysQuery } from '../translation-key.commands';

@Injectable()
@QueryHandler(ListTranslationKeysQuery)
export class ListTranslationKeysHandler implements IQueryHandler<ListTranslationKeysQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListTranslationKeysQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const where: Prisma.TranslationKeyWhereInput = {
      projectId: query.projectId,
      ...(query.search
        ? {
            OR: [
              { key: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.translationKey.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { key: 'asc' },
      }),
      this.prisma.translationKey.count({ where }),
    ]);

    return {
      items,
      meta: { page: query.page, limit: query.limit, total },
    };
  }
}
