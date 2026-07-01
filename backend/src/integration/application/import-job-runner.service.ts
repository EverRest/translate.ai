import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ImportSessionStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { readFile } from 'node:fs/promises';
import { detectImportFormat } from '../domain/format-detector';
import { parseImportSource } from '../domain/parsers/import-parser.registry';
import type { ImportSource, ParseRules } from '../domain/import-document.types';
import { ImportApplyService } from './import-apply.service';
import { ImportDiffService } from './import-diff.service';

@Injectable()
export class ImportJobRunnerService {
  private readonly logger = new Logger(ImportJobRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly diffService: ImportDiffService,
    private readonly applyService: ImportApplyService,
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
      const parseRules = (session.parseRulesJson ?? {}) as ParseRules;
      const detected = detectImportFormat(
        buffer,
        session.originalFilename ?? undefined,
        session.sourceType === 'paste_html' ? 'paste_html' : undefined,
      );

      const source: ImportSource = {
        type: detected.sourceType,
        buffer,
        filename: session.originalFilename ?? undefined,
        parseRules,
      };

      const document = await parseImportSource(source);
      const diff = await this.diffService.diffAgainstProject(
        session.projectId,
        document,
      );

      await this.prisma.importSessionItem.deleteMany({
        where: { sessionId },
      });
      await this.diffService.persistDiffItems(sessionId, diff);

      await this.prisma.importSession.update({
        where: { id: sessionId },
        data: {
          status: ImportSessionStatus.preview_ready,
          sourceType: detected.sourceType,
          statsJson: document.stats as unknown as Prisma.InputJsonValue,
          warningsJson: document.warnings as unknown as Prisma.InputJsonValue,
          diffSummaryJson: diff.summary as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Import parse failed';
      this.logger.error(`Parse failed for session ${sessionId}: ${message}`);
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

  async runApply(
    sessionId: string,
    conflictStrategy: 'skip' | 'update' = 'update',
  ): Promise<void> {
    const session = await this.prisma.importSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.status === ImportSessionStatus.completed) {
      return;
    }

    await this.prisma.importSession.update({
      where: { id: sessionId },
      data: {
        status: ImportSessionStatus.applying,
        errorMessage: null,
      },
    });

    try {
      const result = await this.applyService.applySession(
        sessionId,
        session.tenantId,
        session.projectId,
        conflictStrategy,
      );

      await this.prisma.importSession.update({
        where: { id: sessionId },
        data: {
          status: ImportSessionStatus.completed,
          completedAt: new Date(),
          statsJson: {
            ...(session.statsJson as object),
            applied: result.applied,
            skipped: result.skipped,
          },
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Import apply failed';
      this.logger.error(`Apply failed for session ${sessionId}: ${message}`);
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
}
