import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler,
  QueryHandler,
  IQueryHandler,
} from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { ImportSessionStatus, Prisma } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { detectImportFormat } from '../../domain/format-detector';
import {
  ApplyImportSessionCommand,
  CreateImportSessionCommand,
  GetImportSessionQuery,
  ListImportSessionsQuery,
  PreviewImportSessionQuery,
} from '../import.commands';
import { ImportJobRunnerService } from '../import-job-runner.service';
import { ImportQueueService } from '../../infrastructure/import-queue.service';
import { ImportStorageService } from '../../infrastructure/import-storage.service';
import type { ImportDiffSummary } from '../../domain/import-document.types';

const ASYNC_THRESHOLD = 200;

function toSessionDto(session: {
  id: string;
  projectId: string;
  sourceType: string;
  status: ImportSessionStatus;
  statsJson: unknown;
  warningsJson: unknown;
  diffSummaryJson: unknown;
  originalFilename: string | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}) {
  return {
    id: session.id,
    projectId: session.projectId,
    sourceType: session.sourceType,
    status: session.status,
    stats: session.statsJson,
    warnings: session.warningsJson,
    diffSummary: session.diffSummaryJson as ImportDiffSummary | null,
    originalFilename: session.originalFilename,
    errorMessage: session.errorMessage,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  };
}

@Injectable()
@CommandHandler(CreateImportSessionCommand)
export class CreateImportSessionHandler implements ICommandHandler<CreateImportSessionCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly storage: ImportStorageService,
    private readonly importQueue: ImportQueueService,
    private readonly jobRunner: ImportJobRunnerService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: CreateImportSessionCommand) {
    if (command.buffer.length === 0) {
      throw new BadRequestException('Import file is empty');
    }

    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const detected = detectImportFormat(
      command.buffer,
      command.filename,
      command.sourceType,
    );

    const session = await this.prisma.importSession.create({
      data: {
        tenantId: command.tenantId,
        projectId: command.projectId,
        userId: command.userId,
        sourceType: detected.sourceType,
        status: ImportSessionStatus.pending,
        parseRulesJson: (command.parseRules ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        originalFilename: command.filename,
      },
    });

    const storagePath = await this.storage.writeImportFile(
      command.tenantId,
      session.id,
      command.filename ?? 'upload.bin',
      command.buffer,
    );

    await this.prisma.importSession.update({
      where: { id: session.id },
      data: { storagePath },
    });

    const isLarge =
      command.buffer.length > 512_000 ||
      detected.sourceType === 'confluence_zip';

    if (isLarge) {
      await this.importQueue.enqueueParse({
        sessionId: session.id,
        tenantId: command.tenantId,
      });
      return { ...toSessionDto(session), queued: true };
    }

    await this.jobRunner.runParse(session.id);
    const updated = await this.prisma.importSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    return { ...toSessionDto(updated), queued: false };
  }
}

@Injectable()
@CommandHandler(ApplyImportSessionCommand)
export class ApplyImportSessionHandler implements ICommandHandler<ApplyImportSessionCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly importQueue: ImportQueueService,
    private readonly jobRunner: ImportJobRunnerService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: ApplyImportSessionCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const session = await this.prisma.importSession.findFirst({
      where: {
        id: command.sessionId,
        projectId: command.projectId,
        tenantId: command.tenantId,
      },
    });

    if (!session) {
      throw new NotFoundException('Import session not found');
    }

    if (session.status !== ImportSessionStatus.preview_ready) {
      throw new BadRequestException(
        `Cannot apply import in status: ${session.status}`,
      );
    }

    const itemCount = await this.prisma.importSessionItem.count({
      where: {
        sessionId: session.id,
        action: { in: ['create', 'update', 'conflict'] },
      },
    });

    const threshold = this.config.get<number>(
      'IMPORT_ASYNC_THRESHOLD',
      ASYNC_THRESHOLD,
    );

    if (itemCount > threshold) {
      await this.importQueue.enqueueApply({
        sessionId: session.id,
        tenantId: command.tenantId,
        conflictStrategy: command.conflictStrategy,
      });
      return { queued: true, sessionId: session.id };
    }

    await this.jobRunner.runApply(session.id, command.conflictStrategy);
    const updated = await this.prisma.importSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    return { queued: false, session: toSessionDto(updated) };
  }
}

@Injectable()
@QueryHandler(GetImportSessionQuery)
export class GetImportSessionHandler implements IQueryHandler<GetImportSessionQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: GetImportSessionQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const session = await this.prisma.importSession.findFirst({
      where: {
        id: query.sessionId,
        projectId: query.projectId,
        tenantId: query.tenantId,
      },
    });

    if (!session) {
      throw new NotFoundException('Import session not found');
    }

    return toSessionDto(session);
  }
}

@Injectable()
@QueryHandler(ListImportSessionsQuery)
export class ListImportSessionsHandler implements IQueryHandler<ListImportSessionsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListImportSessionsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.importSession.findMany({
        where: { projectId: query.projectId, tenantId: query.tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.importSession.count({
        where: { projectId: query.projectId, tenantId: query.tenantId },
      }),
    ]);

    return {
      items: items.map(toSessionDto),
      meta: { total, page: query.page, limit: query.limit },
    };
  }
}

@Injectable()
@QueryHandler(PreviewImportSessionQuery)
export class PreviewImportSessionHandler implements IQueryHandler<PreviewImportSessionQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: PreviewImportSessionQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const session = await this.prisma.importSession.findFirst({
      where: {
        id: query.sessionId,
        projectId: query.projectId,
        tenantId: query.tenantId,
      },
    });

    if (!session) {
      throw new NotFoundException('Import session not found');
    }

    const where = {
      sessionId: query.sessionId,
      ...(query.action ? { action: query.action as never } : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.importSessionItem.findMany({
        where,
        orderBy: { key: 'asc' },
        skip,
        take: query.limit,
      }),
      this.prisma.importSessionItem.count({ where }),
    ]);

    return {
      session: toSessionDto(session),
      items: items.map((item) => ({
        id: item.id,
        scope: item.scope,
        key: item.key,
        sourceText: item.sourceText,
        hints: item.hints,
        action: item.action,
        error: item.error,
        warning: item.warning,
        before: item.beforeJson,
        after: item.afterJson,
      })),
      meta: { total, page: query.page, limit: query.limit },
    };
  }
}
