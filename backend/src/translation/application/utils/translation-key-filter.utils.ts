import { Prisma } from '@prisma/client';

export type TranslationKeyListFilter = {
  localizationObjectId?: string;
  keyPrefix?: string;
};

export function buildTranslationKeyListFilter(
  projectId: string,
  search?: string,
  filter?: TranslationKeyListFilter,
): Prisma.TranslationKeyWhereInput {
  const where: Prisma.TranslationKeyWhereInput = {
    projectId,
    ...(filter?.localizationObjectId
      ? { localizationObjectId: filter.localizationObjectId }
      : {}),
    ...(filter?.keyPrefix
      ? { key: { startsWith: filter.keyPrefix, mode: 'insensitive' } }
      : {}),
    ...(search
      ? {
          OR: [
            { key: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return where;
}
