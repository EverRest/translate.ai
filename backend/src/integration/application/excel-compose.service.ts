import { Injectable, Logger } from '@nestjs/common';
import { JobItemStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { composeExcelWorkbook } from '../domain/parsers/excel.parser';
import type { ExcelDeltaItem, ExcelLayout } from '../domain/excel.types';
import { ImportStorageService } from '../infrastructure/import-storage.service';

type ExcelLayoutWithItems = ExcelLayout & { deltaItems?: ExcelDeltaItem[] };

@Injectable()
export class ExcelComposeService {
  private readonly logger = new Logger(ExcelComposeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ImportStorageService,
  ) {}

  async composeSession(sessionId: string): Promise<void> {
    const session = await this.prisma.importSession.findUnique({
      where: { id: sessionId },
    });

    if (!session?.storagePath) {
      throw new Error('Import session has no stored file');
    }

    const layout = session.excelLayoutJson as unknown as ExcelLayoutWithItems;
    const deltaItems = layout.deltaItems ?? [];

    if (deltaItems.length === 0) {
      throw new Error('No delta items to compose');
    }

    await this.prisma.importSession.update({
      where: { id: sessionId },
      data: { status: 'composing' },
    });

    try {
      const jobItemIds = deltaItems
        .map((item) => item.jobItemId)
        .filter((id): id is string => Boolean(id));

      const jobItems = await this.prisma.translationJobItem.findMany({
        where: { id: { in: jobItemIds } },
        include: {
          translationKey: {
            include: {
              translations: true,
            },
          },
        },
      });

      const translationsByJobItemId = new Map<string, string>();

      for (const item of jobItems) {
        if (item.status !== JobItemStatus.completed) {
          continue;
        }
        const translation = item.translationKey.translations.find(
          (t) => t.language === item.language,
        );
        if (translation?.value) {
          translationsByJobItemId.set(item.id, translation.value);
        }
      }

      const originalBuffer = await this.storage.readImportFile(
        session.storagePath,
      );

      const composeCells = deltaItems.map((item) => ({
        row: item.row,
        col: item.col,
        targetLang: item.targetLang,
        jobItemId: item.jobItemId,
      }));

      const outputBuffer = await composeExcelWorkbook(
        originalBuffer,
        {
          sheetName: layout.sheetName,
          emptyCells: composeCells,
        },
        translationsByJobItemId,
      );

      const outputFilename =
        session.originalFilename?.replace(/\.xlsx?$/i, '') ?? 'export';
      const outputPath = await this.storage.writeImportFile(
        session.tenantId,
        sessionId,
        `${outputFilename}-translated.xlsx`,
        outputBuffer,
      );

      await this.prisma.importSession.update({
        where: { id: sessionId },
        data: {
          status: 'download_ready',
          outputStoragePath: outputPath,
          completedAt: new Date(),
          statsJson: {
            ...(session.statsJson as object),
            composedCells: translationsByJobItemId.size,
            failedCells: deltaItems.length - translationsByJobItemId.size,
          },
        },
      });

      this.logger.log(
        `Composed Excel for session ${sessionId}: ${translationsByJobItemId.size}/${deltaItems.length} cells filled`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Excel compose failed';
      this.logger.error(`Compose failed for session ${sessionId}: ${message}`);
      await this.prisma.importSession.update({
        where: { id: sessionId },
        data: {
          status: 'failed',
          errorMessage: message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }
}
