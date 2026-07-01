import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImportSessionStatus } from '@prisma/client';
import { PrismaService } from '../shared/prisma/prisma.service';
import { ConfluenceSyncTriggerService } from '../integration/application/confluence-sync-trigger.service';

const DEFAULT_TICK_MS = 5 * 60 * 1000;

@Injectable()
export class ConfluenceSyncSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ConfluenceSyncSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private readonly tickMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly trigger: ConfluenceSyncTriggerService,
    config: ConfigService,
  ) {
    this.tickMs = config.get<number>(
      'CONFLUENCE_SYNC_SCHEDULER_TICK_MS',
      DEFAULT_TICK_MS,
    );
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, this.tickMs);
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async tick(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const dueConfigs = await this.prisma.confluenceSyncConfig.findMany({
        where: {
          syncEnabled: true,
          syncIntervalMinutes: { not: null },
          OR: [{ nextSyncAt: null }, { nextSyncAt: { lte: new Date() } }],
          connection: { project: { status: 'active' } },
        },
        include: {
          connection: true,
        },
        take: 20,
      });

      for (const config of dueConfigs) {
        if (config.pageIds.length === 0) {
          continue;
        }

        const inProgress = await this.prisma.importSession.findFirst({
          where: {
            projectId: config.connection.projectId,
            sourceType: 'confluence_live',
            status: {
              in: [ImportSessionStatus.parsing, ImportSessionStatus.applying],
            },
          },
        });
        if (inProgress) {
          continue;
        }

        try {
          await this.trigger.triggerForProject(
            config.connection.tenantId,
            config.connection.projectId,
            config.connection.connectedById,
          );
          await this.prisma.confluenceSyncConfig.update({
            where: { id: config.id },
            data: {
              nextSyncAt: new Date(
                Date.now() + (config.syncIntervalMinutes ?? 60) * 60_000,
              ),
            },
          });
          this.logger.log(
            `Scheduled Confluence sync for project ${config.connection.projectId}`,
          );
        } catch (error) {
          this.logger.warn(
            `Scheduled sync failed for project ${config.connection.projectId}: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
