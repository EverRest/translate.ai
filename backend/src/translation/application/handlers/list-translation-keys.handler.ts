import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { ListTranslationKeysQuery } from '../translation-key.commands';
import { StaleTranslationService } from '../services/stale-translation.service';
import { buildTranslationKeyListFilter } from '../utils/translation-key-filter.utils';

@Injectable()
@QueryHandler(ListTranslationKeysQuery)
export class ListTranslationKeysHandler implements IQueryHandler<ListTranslationKeysQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly staleService: StaleTranslationService,
  ) {}

  async execute(query: ListTranslationKeysQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const where: Prisma.TranslationKeyWhereInput =
      buildTranslationKeyListFilter(query.projectId, query.search, {
        localizationObjectId: query.localizationObjectId,
        keyPrefix: query.keyPrefix,
        scope: query.scope,
      });

    if (query.staleOnly) {
      const staleKeyIds = await this.staleService.getStaleKeyIds(
        query.projectId,
      );
      where.id = { in: staleKeyIds };
    }

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
