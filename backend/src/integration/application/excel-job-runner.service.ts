import { Injectable, Logger } from '@nestjs/common';
import { ImportSessionStatus, Prisma } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { parseExcelWorkbook } from '../domain/parsers/excel.parser';
import type { ExcelParseRules } from '../domain/excel.types';
import { ImportStorageService } from '../infrastructure/import-storage.service';
import { ExcelQueueService } from '../infrastructure/excel-queue.service';

@Injectable()
export class ExcelJobRunnerService {
  private readonly logger = new Logger(ExcelJobRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ImportStorageService,
    private readonly excelQueue: ExcelQueueService,
  ) {}

  async runParse(sessionId: string): Promise<void> {
    const session = await this.prisma.importSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status === ImportSessionStatus.preview_ready) {
      return;
    }

    await this.prisma.importSession.update({
      where: { id: sessionId },
      data: {
        status: ImportSessionStatus.parsing,
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    try {
      if (!session.storagePath) {
        throw new Error('Import session has no stored file');
      }

      const buffer = await readFile(session.storagePath);
      const parseRules = (session.parseRulesJson ?? {}) as ExcelParseRules;
      const result = await parseExcelWorkbook(buffer, parseRules);

      if (result.warnings.some((w) => w.code === 'MISSING_COLUMNS')) {
        throw new Error(result.warnings[0]?.message ?? 'Invalid Excel format');
      }

      await this.prisma.importSession.update({
        where: { id: sessionId },
        data: {
          status: ImportSessionStatus.preview_ready,
          sourceType: 'excel_delta',
          statsJson: result.stats as unknown as Prisma.InputJsonValue,
          warningsJson: result.warnings as unknown as Prisma.InputJsonValue,
          excelLayoutJson: {
            ...result.layout,
            sampleRows: result.sampleRows,
          } as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Excel parse failed';
      this.logger.error(
        `Excel parse failed for session ${sessionId}: ${message}`,
      );
      await this.prisma.importSession.update({
        where: { id: sessionId },
        data: {
          status: ImportSessionStatus.failed,
          errorMessage: message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async enqueueParseIfLarge(
    sessionId: string,
    tenantId: string,
    bufferSize: number,
  ): Promise<boolean> {
    const isLarge = bufferSize > 512_000;
    if (isLarge) {
      await this.excelQueue.enqueueParse({ sessionId, tenantId });
      return true;
    }
    await this.runParse(sessionId);
    return false;
  }
}
