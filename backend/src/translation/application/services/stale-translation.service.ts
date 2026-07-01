import { Injectable } from '@nestjs/common';
import { TranslationStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  isSourceTextChanged,
  isTranslationStale,
} from '../utils/stale-translation.utils';

export type StaleTranslationRow = {
  translationId: string;
  translationKeyId: string;
  key: string;
  language: string;
};

@Injectable()
export class StaleTranslationService {
  constructor(private readonly prisma: PrismaService) {}

  async invalidateForKey(translationKeyId: string): Promise<number> {
    const result = await this.prisma.translation.updateMany({
      where: {
        translationKeyId,
        NOT: { value: '' },
      },
      data: { status: TranslationStatus.review },
    });
    return result.count;
  }

  async captureSnapshotForKey(
    translationKeyId: string,
    sourceText: string,
  ): Promise<void> {
    await this.prisma.translation.updateMany({
      where: { translationKeyId },
      data: { sourceTextSnapshot: sourceText },
    });
  }

  async captureSnapshotForTranslation(
    translationId: string,
    sourceText: string,
  ): Promise<void> {
    await this.prisma.translation.update({
      where: { id: translationId },
      data: { sourceTextSnapshot: sourceText },
    });
  }

  async invalidateIfSourceChanged(
    translationKeyId: string,
    before: string,
    after: string,
  ): Promise<boolean> {
    if (!isSourceTextChanged(before, after)) {
      return false;
    }
    await this.invalidateForKey(translationKeyId);
    return true;
  }

  async listStaleForProject(projectId: string): Promise<StaleTranslationRow[]> {
    const rows = await this.prisma.translation.findMany({
      where: {
        sourceTextSnapshot: { not: null },
        NOT: { value: '' },
        translationKey: { projectId },
      },
      select: {
        id: true,
        language: true,
        sourceTextSnapshot: true,
        translationKey: {
          select: { id: true, key: true, sourceText: true },
        },
      },
    });

    return rows
      .filter((row) =>
        isTranslationStale(
          row.sourceTextSnapshot,
          row.translationKey.sourceText,
        ),
      )
      .map((row) => ({
        translationId: row.id,
        translationKeyId: row.translationKey.id,
        key: row.translationKey.key,
        language: row.language,
      }));
  }

  async getStaleSummary(projectId: string): Promise<{
    totalStaleKeys: number;
    totalStaleTranslations: number;
    byLanguage: Record<string, number>;
  }> {
    const stale = await this.listStaleForProject(projectId);
    const keyIds = new Set(stale.map((row) => row.translationKeyId));
    const byLanguage: Record<string, number> = {};

    for (const row of stale) {
      byLanguage[row.language] = (byLanguage[row.language] ?? 0) + 1;
    }

    return {
      totalStaleKeys: keyIds.size,
      totalStaleTranslations: stale.length,
      byLanguage,
    };
  }

  async getStaleKeyIds(projectId: string): Promise<string[]> {
    const stale = await this.listStaleForProject(projectId);
    return [...new Set(stale.map((row) => row.translationKeyId))];
  }

  async getStaleKeyNames(projectId: string): Promise<string[]> {
    const stale = await this.listStaleForProject(projectId);
    return [...new Set(stale.map((row) => row.key))];
  }

  async filterStaleJobItems(
    projectId: string,
    languages: string[],
    keyNames?: string[],
  ): Promise<
    Array<{ translationKeyId: string; key: string; language: string }>
  > {
    let stale = await this.listStaleForProject(projectId);
    const langSet = new Set(languages.map((l) => l.toLowerCase()));
    stale = stale.filter((row) => langSet.has(row.language.toLowerCase()));

    if (keyNames?.length) {
      const keySet = new Set(keyNames);
      stale = stale.filter((row) => keySet.has(row.key));
    }

    return stale.map((row) => ({
      translationKeyId: row.translationKeyId,
      key: row.key,
      language: row.language,
    }));
  }
}
