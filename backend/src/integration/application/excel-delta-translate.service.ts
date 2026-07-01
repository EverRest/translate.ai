import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobItemStatus, JobStatus, Prisma } from '@prisma/client';

import { resolveJobAiProvider } from '../../ai-provider/domain/ai-provider.utils';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { isValidLanguageCode } from '../../shared/utils/string.utils';
import { TranslationJobRunnerService } from '../../translation/application/services/translation-job-runner.service';
import { TranslationQueueService } from '../../translation/infrastructure/translation-queue.service';
import type { ExcelDeltaItem, ExcelLayout } from '../domain/excel.types';

@Injectable()
export class ExcelDeltaTranslateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: TranslationQueueService,
    private readonly jobRunner: TranslationJobRunnerService,
    private readonly config: ConfigService,
  ) {}

  async startDeltaTranslate(
    sessionId: string,
    tenantId: string,
    projectId: string,
    userId: string,
    languages?: string[],
    provider?: string,
  ): Promise<{ jobId: string; itemCount: number }> {
    const session = await this.prisma.importSession.findFirstOrThrow({
      where: { id: sessionId, tenantId, projectId },
    });

    const layout = session.excelLayoutJson as unknown as ExcelLayout | null;
    if (!layout?.emptyCells?.length) {
      throw new Error('No empty cells to translate in this session');
    }

    const targetLangs =
      languages?.map((l) => l.toLowerCase()) ??
      layout.targetLanguages.map((l) => l.toLowerCase());

    for (const code of targetLangs) {
      if (!isValidLanguageCode(code)) {
        throw new Error(`Invalid language code: ${code}`);
      }
    }

    const cellsToTranslate = layout.emptyCells.filter((cell) =>
      targetLangs.includes(cell.targetLang.toLowerCase()),
    );

    if (cellsToTranslate.length === 0) {
      throw new Error('No empty cells match selected languages');
    }

    await this.prisma.projectLanguage.createMany({
      data: targetLangs.map((code) => ({ projectId, code })),
      skipDuplicates: true,
    });

    const uniqueKeys = new Map<string, (typeof cellsToTranslate)[0]>();
    for (const cell of cellsToTranslate) {
      if (!uniqueKeys.has(cell.key)) {
        uniqueKeys.set(cell.key, cell);
      }
    }

    const keyRecords = new Map<string, string>();
    for (const [, cell] of uniqueKeys) {
      const contextParts: string[] = [];
      if (cell.scope) {
        contextParts.push(`scope: ${cell.scope}`);
      }
      if (cell.fieldId) {
        contextParts.push(`fieldId: ${cell.fieldId}`);
      }
      const context =
        contextParts.length > 0 ? contextParts.join('\n') : undefined;

      const existing = await this.prisma.translationKey.findUnique({
        where: { projectId_key: { projectId, key: cell.key } },
      });

      if (existing) {
        keyRecords.set(cell.key, existing.id);
      } else {
        const created = await this.prisma.translationKey.create({
          data: {
            projectId,
            key: cell.key,
            sourceText: cell.sourceText,
            context,
          },
        });
        keyRecords.set(cell.key, created.id);
      }
    }

    const resolvedProvider = resolveJobAiProvider(
      provider,
      this.config.get<string>('AI_PROVIDER', 'gemini'),
    );

    const job = await this.prisma.translationJob.create({
      data: {
        projectId,
        provider: resolvedProvider,
        status: JobStatus.pending,
        createdById: userId,
        items: {
          create: cellsToTranslate.map((cell) => ({
            translationKeyId: keyRecords.get(cell.key)!,
            language: cell.targetLang.toLowerCase(),
            status: JobItemStatus.pending,
          })),
        },
      },
      include: { items: true },
    });

    const itemByKeyLang = new Map(
      job.items.map((item) => [
        `${item.translationKeyId}:${item.language}`,
        item.id,
      ]),
    );

    const deltaItems: ExcelDeltaItem[] = cellsToTranslate.map((cell) => {
      const translationKeyId = keyRecords.get(cell.key)!;
      const jobItemId = itemByKeyLang.get(
        `${translationKeyId}:${cell.targetLang.toLowerCase()}`,
      );
      return {
        ...cell,
        translationKeyId,
        jobItemId,
      };
    });

    const updatedLayout: ExcelLayout & { deltaItems: ExcelDeltaItem[] } = {
      ...layout,
      deltaItems,
    };

    await this.prisma.importSession.update({
      where: { id: sessionId },
      data: {
        status: 'translating',
        translationJobId: job.id,
        excelLayoutJson: updatedLayout as unknown as Prisma.InputJsonValue,
      },
    });

    this.jobRunner.publishJobCreated(job.id, projectId, tenantId);

    await this.queue.enqueueCreate({
      jobId: job.id,
      tenantId,
      correlationId: `excel-delta-${sessionId}`,
    });

    return { jobId: job.id, itemCount: cellsToTranslate.length };
  }
}
