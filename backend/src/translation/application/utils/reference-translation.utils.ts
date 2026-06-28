import { TranslationStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import type { ReferenceTranslationOption } from '../../../shared/utils/reference-translation-prompt.utils';

export type ReferenceTranslationRow = {
  language: string;
  value: string;
  status: TranslationStatus;
};

export type { ReferenceTranslationOption };

export const MAX_REFERENCE_TRANSLATIONS = 8;
export const MAX_REFERENCE_VALUE_LENGTH = 300;

const STATUS_PRIORITY: Record<TranslationStatus, number> = {
  [TranslationStatus.published]: 0,
  [TranslationStatus.approved]: 1,
  [TranslationStatus.review]: 2,
  [TranslationStatus.draft]: 3,
};

export function truncateReferenceValue(
  value: string,
  maxLength = MAX_REFERENCE_VALUE_LENGTH,
): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function selectReferenceTranslations(
  rows: ReferenceTranslationRow[],
  excludeLanguage: string,
  max = MAX_REFERENCE_TRANSLATIONS,
): ReferenceTranslationOption[] {
  const exclude = excludeLanguage.toLowerCase();

  return rows
    .filter(
      (row) =>
        row.language.toLowerCase() !== exclude && row.value.trim().length > 0,
    )
    .sort((a, b) => {
      const priorityDiff =
        STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return a.language.localeCompare(b.language);
    })
    .slice(0, max)
    .map((row) => ({
      language: row.language,
      value: truncateReferenceValue(row.value),
    }));
}

export async function loadReferenceTranslations(
  prisma: PrismaService,
  translationKeyId: string,
  excludeLanguage: string,
): Promise<ReferenceTranslationOption[]> {
  const rows = await prisma.translation.findMany({
    where: { translationKeyId },
    select: { language: true, value: true, status: true },
  });

  return selectReferenceTranslations(rows, excludeLanguage);
}

export function shouldIncludeReferenceTranslations(
  attempt: number,
  includeFromRetryPayload?: boolean,
  referenceCount = 0,
): boolean {
  if (referenceCount === 0) {
    return false;
  }
  return attempt > 1 || includeFromRetryPayload === true;
}
