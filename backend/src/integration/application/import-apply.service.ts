import { Injectable } from '@nestjs/common';
import { ImportSessionItemAction } from '@prisma/client';
import { AuditService } from '../../audit/application/audit.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { StaleTranslationService } from '../../translation/application/services/stale-translation.service';
import { buildKeyContext } from '../domain/hint-parser';
import type { ImportDiffItem } from '../domain/import-document.types';

const APPLY_CHUNK_SIZE = 100;

@Injectable()
export class ImportApplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly staleTranslations: StaleTranslationService,
  ) {}

  async applySession(
    sessionId: string,
    tenantId: string,
    projectId: string,
    conflictStrategy: 'skip' | 'update' = 'update',
  ): Promise<{ applied: number; skipped: number }> {
    const items = await this.prisma.importSessionItem.findMany({
      where: {
        sessionId,
        action: {
          in: [
            ImportSessionItemAction.create,
            ImportSessionItemAction.update,
            ImportSessionItemAction.conflict,
          ],
        },
      },
    });

    let applied = 0;
    let skipped = 0;

    const existingKeys = await this.prisma.translationKey.findMany({
      where: { projectId },
      select: { id: true, key: true, sourceText: true },
    });
    const existingByKey = new Map(existingKeys.map((k) => [k.key, k]));

    for (let i = 0; i < items.length; i += APPLY_CHUNK_SIZE) {
      const chunk = items.slice(i, i + APPLY_CHUNK_SIZE);
      await this.prisma.$transaction(async (tx) => {
        for (const item of chunk) {
          if (
            item.action === ImportSessionItemAction.conflict &&
            conflictStrategy === 'skip'
          ) {
            skipped += 1;
            continue;
          }

          const context = buildKeyContext(
            item.scope ?? undefined,
            item.hints ?? undefined,
          );

          const prior = existingByKey.get(item.key);

          const key = await tx.translationKey.upsert({
            where: {
              projectId_key: { projectId, key: item.key },
            },
            create: {
              projectId,
              key: item.key,
              sourceText: item.sourceText,
              context,
            },
            update: {
              sourceText: item.sourceText,
              context,
            },
          });

          if (prior) {
            await this.staleTranslations.invalidateIfSourceChanged(
              key.id,
              prior.sourceText,
              item.sourceText,
            );
            prior.sourceText = item.sourceText;
          } else {
            existingByKey.set(item.key, {
              id: key.id,
              key: item.key,
              sourceText: item.sourceText,
            });
          }

          await tx.importSessionItem.update({
            where: { id: item.id },
            data: { translationKeyId: key.id },
          });

          applied += 1;
        }
      });
    }

    await this.audit.log({
      tenantId,
      entity: 'project',
      entityId: projectId,
      action: 'import.apply',
      payload: { sessionId, applied, skipped },
    });

    return { applied, skipped };
  }

  static diffItemToDbAction(
    action: ImportDiffItem['action'],
  ): ImportSessionItemAction {
    switch (action) {
      case 'create':
        return ImportSessionItemAction.create;
      case 'update':
        return ImportSessionItemAction.update;
      case 'unchanged':
        return ImportSessionItemAction.unchanged;
      case 'conflict':
        return ImportSessionItemAction.conflict;
      case 'invalid':
        return ImportSessionItemAction.invalid;
      case 'skip':
      default:
        return ImportSessionItemAction.skip;
    }
  }
}
