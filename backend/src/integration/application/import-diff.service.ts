import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  computeImportDiff,
  type ExistingKey,
} from '../domain/import-diff.utils';
import type {
  ImportDiffSummary,
  ImportDocument,
} from '../domain/import-document.types';
import { ImportApplyService } from './import-apply.service';

@Injectable()
export class ImportDiffService {
  constructor(private readonly prisma: PrismaService) {}

  async diffAgainstProject(
    projectId: string,
    document: ImportDocument,
  ): Promise<{
    items: ReturnType<typeof computeImportDiff>['items'];
    summary: ImportDiffSummary;
  }> {
    const existing = await this.prisma.translationKey.findMany({
      where: { projectId },
      select: {
        id: true,
        key: true,
        sourceText: true,
        context: true,
      },
    });

    const existingKeys: ExistingKey[] = existing.map((k) => ({
      id: k.id,
      key: k.key,
      sourceText: k.sourceText,
      context: k.context,
    }));

    return computeImportDiff(document.rows, existingKeys);
  }

  async persistDiffItems(
    sessionId: string,
    diff: ReturnType<typeof computeImportDiff>,
  ): Promise<void> {
    const data = diff.items.map((item) => ({
      sessionId,
      externalSource: item.row.externalSource ?? 'confluence',
      externalId: item.row.externalId,
      scope: item.row.scope,
      key: item.row.key,
      sourceText: item.row.sourceText,
      hints: item.row.hints,
      action: ImportApplyService.diffItemToDbAction(item.action),
      error: item.error,
      warning: item.warning,
      beforeJson: item.before ?? undefined,
      afterJson: item.after ?? undefined,
    }));

    const chunkSize = 500;
    for (let i = 0; i < data.length; i += chunkSize) {
      await this.prisma.importSessionItem.createMany({
        data: data.slice(i, i + chunkSize),
      });
    }
  }
}
