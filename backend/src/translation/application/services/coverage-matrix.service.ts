import { Injectable } from '@nestjs/common';
import { TranslationStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  buildCoverageCell,
  type CoverageCell,
  isApprovedStatus,
  pickWorstCells,
  resolveKeyScope,
  UNSPECIFIED_SCOPE,
} from '../utils/coverage-matrix.utils';

type TranslationRow = {
  translationKeyId: string;
  language: string;
  value: string;
  status: TranslationStatus;
};

@Injectable()
export class CoverageMatrixService {
  constructor(private readonly prisma: PrismaService) {}

  async getCoverageMatrix(
    projectId: string,
    options?: { scopes?: string[]; languages?: string[] },
  ) {
    const [keys, translations] = await Promise.all([
      this.prisma.translationKey.findMany({
        where: { projectId },
        select: { id: true, context: true },
      }),
      this.prisma.translation.findMany({
        where: { translationKey: { projectId } },
        select: {
          translationKeyId: true,
          language: true,
          value: true,
          status: true,
        },
      }),
    ]);

    const keyScopes = new Map(
      keys.map((key) => [key.id, resolveKeyScope(key.context)]),
    );

    const scopeSet = new Set<string>(
      options?.scopes?.length
        ? options.scopes
        : [...new Set(keys.map((key) => resolveKeyScope(key.context)))],
    );

    const languageSet = new Set<string>(
      options?.languages?.length
        ? options.languages.map((l) => l.toLowerCase())
        : translations.map((row) => row.language.toLowerCase()),
    );

    const keysByScope = new Map<string, string[]>();
    for (const key of keys) {
      const scope = keyScopes.get(key.id) ?? UNSPECIFIED_SCOPE;
      if (!scopeSet.has(scope)) continue;
      const bucket = keysByScope.get(scope) ?? [];
      bucket.push(key.id);
      keysByScope.set(scope, bucket);
    }

    const translationsByKeyLang = new Map<string, TranslationRow>();
    for (const row of translations) {
      const lang = row.language.toLowerCase();
      if (!languageSet.has(lang)) continue;
      translationsByKeyLang.set(`${row.translationKeyId}:${lang}`, row);
    }

    const cells: CoverageCell[] = [];
    const languageTotals = new Map<
      string,
      { total: number; approved: number; translated: number; missing: number }
    >();

    for (const scope of [...scopeSet].sort()) {
      const keyIds = keysByScope.get(scope) ?? [];
      for (const language of [...languageSet].sort()) {
        let translated = 0;
        let approved = 0;
        let draft = 0;

        for (const keyId of keyIds) {
          const row = translationsByKeyLang.get(`${keyId}:${language}`);
          if (!row || row.value.trim() === '') continue;
          translated += 1;
          if (isApprovedStatus(row.status)) approved += 1;
          if (row.status === TranslationStatus.draft) draft += 1;
        }

        const total = keyIds.length;
        const missing = total - translated;
        const cell = buildCoverageCell(scope, language, {
          total,
          translated,
          approved,
          missing,
          draft,
        });
        cells.push(cell);

        const langSummary = languageTotals.get(language) ?? {
          total: 0,
          approved: 0,
          translated: 0,
          missing: 0,
        };
        langSummary.total += total;
        langSummary.approved += approved;
        langSummary.translated += translated;
        langSummary.missing += missing;
        languageTotals.set(language, langSummary);
      }
    }

    const byLanguage = Object.fromEntries(
      [...languageTotals.entries()].map(([language, counts]) => [
        language,
        {
          ...counts,
          approvedPct:
            counts.total === 0
              ? 0
              : Math.round((counts.approved / counts.total) * 100),
        },
      ]),
    );

    return {
      scopes: [...scopeSet].sort(),
      languages: [...languageSet].sort(),
      cells,
      byLanguage,
      worstCells: pickWorstCells(cells, 3),
    };
  }
}
