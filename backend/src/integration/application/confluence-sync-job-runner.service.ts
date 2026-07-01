import { Injectable, Logger } from '@nestjs/common';
import { ImportSessionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type {
  ImportDocument,
  ParseRules,
} from '../domain/import-document.types';
import { ConfluenceFetchService } from './confluence-fetch.service';
import { ImportApplyService } from './import-apply.service';
import { ImportDiffService } from './import-diff.service';

export interface ConfluenceSyncJobPayload {
  tenantId: string;
  projectId: string;
  sessionId: string;
  connectionId: string;
  pageIds: string[];
  parseRules?: ParseRules;
  autoApply: boolean;
  userId: string;
}

@Injectable()
export class ConfluenceSyncJobRunnerService {
  private readonly logger = new Logger(ConfluenceSyncJobRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fetchService: ConfluenceFetchService,
    private readonly diffService: ImportDiffService,
    private readonly applyService: ImportApplyService,
  ) {}

  async run(payload: ConfluenceSyncJobPayload): Promise<void> {
    const { sessionId, connectionId, pageIds, parseRules, autoApply } = payload;

    await this.prisma.importSession.update({
      where: { id: sessionId },
      data: {
        status: ImportSessionStatus.parsing,
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    try {
      const document = await this.fetchService.fetchPagesAsDocument(
        connectionId,
        pageIds,
        parseRules,
      );
      await this.persistParseResult(sessionId, payload.projectId, document);

      if (autoApply) {
        await this.prisma.importSession.update({
          where: { id: sessionId },
          data: { status: ImportSessionStatus.applying },
        });
        const session = await this.prisma.importSession.findUniqueOrThrow({
          where: { id: sessionId },
        });
        const result = await this.applyService.applySession(
          sessionId,
          session.tenantId,
          session.projectId,
          'update',
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
      }

      const session = await this.prisma.importSession.findUniqueOrThrow({
        where: { id: sessionId },
      });

      await this.prisma.confluenceSyncConfig.update({
        where: { connectionId },
        data: {
          lastSyncedAt: new Date(),
          lastSyncStatus: autoApply ? 'completed' : 'preview_ready',
          lastSyncSummaryJson: session.diffSummaryJson as Prisma.InputJsonValue,
          lastImportSessionId: sessionId,
          lastErrorMessage: null,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Confluence sync failed';
      this.logger.error(`Sync failed for session ${sessionId}: ${message}`);

      await this.prisma.importSession.update({
        where: { id: sessionId },
        data: {
          status: ImportSessionStatus.failed,
          errorMessage: message,
          completedAt: new Date(),
        },
      });

      await this.prisma.confluenceSyncConfig.update({
        where: { connectionId },
        data: {
          lastSyncStatus: 'failed',
          lastErrorMessage: message,
        },
      });

      throw error;
    }
  }

  private async persistParseResult(
    sessionId: string,
    projectId: string,
    document: ImportDocument,
  ): Promise<void> {
    const diff = await this.diffService.diffAgainstProject(projectId, document);

    await this.prisma.importSessionItem.deleteMany({ where: { sessionId } });
    await this.diffService.persistDiffItems(sessionId, diff);

    await this.prisma.importSession.update({
      where: { id: sessionId },
      data: {
        status: ImportSessionStatus.preview_ready,
        sourceType: 'confluence_live',
        statsJson: document.stats as unknown as Prisma.InputJsonValue,
        warningsJson: document.warnings as unknown as Prisma.InputJsonValue,
        diffSummaryJson: diff.summary as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });
  }
}
