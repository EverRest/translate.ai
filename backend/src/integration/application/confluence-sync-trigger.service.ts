import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ImportSessionStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { ParseRules } from '../domain/import-document.types';
import { ConfluenceSyncQueueService } from '../infrastructure/confluence-sync-queue.service';

export interface ConfluenceSyncTriggerResult {
  queued: boolean;
  sessionId: string;
  autoApply: boolean;
}

@Injectable()
export class ConfluenceSyncTriggerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly syncQueue: ConfluenceSyncQueueService,
  ) {}

  async triggerForProject(
    tenantId: string,
    projectId: string,
    userId: string,
    autoApplyOverride?: boolean,
  ): Promise<ConfluenceSyncTriggerResult> {
    const connection = await this.prisma.confluenceConnection.findUnique({
      where: { projectId },
      include: { syncConfig: true },
    });
    if (!connection?.syncConfig) {
      throw new NotFoundException('Confluence is not connected');
    }

    const pageIds = connection.syncConfig.pageIds;
    if (pageIds.length === 0) {
      throw new BadRequestException(
        'Select at least one Confluence page to sync',
      );
    }

    const inProgress = await this.prisma.importSession.findFirst({
      where: {
        projectId,
        sourceType: 'confluence_live',
        status: {
          in: [ImportSessionStatus.parsing, ImportSessionStatus.applying],
        },
      },
    });
    if (inProgress) {
      throw new BadRequestException('A Confluence sync is already in progress');
    }

    const autoApply =
      autoApplyOverride ?? connection.syncConfig.autoApply ?? false;

    const session = await this.prisma.importSession.create({
      data: {
        tenantId,
        projectId,
        userId,
        sourceType: 'confluence_live',
        status: ImportSessionStatus.pending,
        parseRulesJson: connection.syncConfig.parseRulesJson ?? undefined,
        originalFilename: 'confluence-live-sync',
      },
    });

    await this.syncQueue.enqueue({
      tenantId,
      projectId,
      sessionId: session.id,
      connectionId: connection.id,
      pageIds,
      parseRules: (connection.syncConfig.parseRulesJson ?? undefined) as
        | ParseRules
        | undefined,
      autoApply,
      userId,
    });

    return {
      queued: true,
      sessionId: session.id,
      autoApply,
    };
  }
}
