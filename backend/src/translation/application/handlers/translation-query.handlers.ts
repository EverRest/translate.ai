import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  GetTranslationQuery,
  ListTranslationsQuery,
  LookupTranslationsQuery,
} from '../translation.queries';
import { buildTranslationKeyListFilter } from '../utils/translation-key-filter.utils';

function mapTranslation(translation: {
  id: string;
  language: string;
  value: string;
  status: string;
  provider: string | null;
  version: number;
  translationKey: { key: string; sourceText: string };
}) {
  return {
    id: translation.id,
    key: translation.translationKey.key,
    sourceText: translation.translationKey.sourceText,
    language: translation.language,
    value: translation.value,
    status: translation.status,
    provider: translation.provider,
    version: translation.version,
  };
}

@Injectable()
@QueryHandler(ListTranslationsQuery)
export class ListTranslationsHandler implements IQueryHandler<ListTranslationsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListTranslationsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const keyFilter = buildTranslationKeyListFilter(
      query.projectId,
      undefined,
      {
        localizationObjectId: query.localizationObjectId,
        keyPrefix: query.keyPrefix,
      },
    );

    const where = {
      translationKey: {
        ...keyFilter,
        ...(query.keys?.length ? { key: { in: query.keys } } : {}),
      },
      ...(query.language ? { language: query.language } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.translation.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ translationKey: { key: 'asc' } }, { language: 'asc' }],
        include: {
          translationKey: { select: { key: true, sourceText: true } },
        },
      }),
      this.prisma.translation.count({ where }),
    ]);

    return {
      items: items.map(mapTranslation),
      meta: { page: query.page, limit: query.limit, total },
    };
  }
}

@Injectable()
@QueryHandler(GetTranslationQuery)
export class GetTranslationHandler implements IQueryHandler<GetTranslationQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: GetTranslationQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const translation = await this.prisma.translation.findFirst({
      where: {
        id: query.translationId,
        translationKey: { projectId: query.projectId },
      },
      include: {
        translationKey: { select: { key: true, sourceText: true } },
      },
    });

    if (!translation) {
      throw new NotFoundException('Translation not found');
    }

    return mapTranslation(translation);
  }
}

@Injectable()
@QueryHandler(LookupTranslationsQuery)
export class LookupTranslationsHandler implements IQueryHandler<LookupTranslationsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: LookupTranslationsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    if (query.items.length === 0) {
      return { items: [], missing: [] };
    }

    const keys = [...new Set(query.items.map((item) => item.key))];
    const translations = await this.prisma.translation.findMany({
      where: {
        translationKey: {
          projectId: query.projectId,
          key: { in: keys },
        },
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        translationKey: { select: { key: true, sourceText: true } },
      },
    });

    const byPair = new Map(
      translations.map((translation) => [
        `${translation.translationKey.key}:${translation.language}`,
        translation,
      ]),
    );

    const items = [];
    const missing = [];

    for (const request of query.items) {
      const match = byPair.get(`${request.key}:${request.language}`);
      if (match) {
        items.push(mapTranslation(match));
      } else {
        missing.push(request);
      }
    }

    return { items, missing };
  }
}
