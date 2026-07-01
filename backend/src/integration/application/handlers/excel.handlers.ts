import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  EventsHandler,
  ICommandHandler,
  IEventHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import { ImportSessionStatus, Prisma } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  TranslationJobCompletedEvent,
  TranslationJobFailedEvent,
} from '../../../translation/domain/events/translation-job.events';
import type {
  ExcelImportProfile,
  ExcelParseRules,
} from '../../domain/excel.types';
import { WIZ_CLASSIC_PRESET } from '../../domain/parsers/wiz-classic-preset';
import {
  DeltaTranslateExcelImportCommand,
  DownloadExcelImportQuery,
  GetExcelImportProfileQuery,
  GetExcelImportSessionQuery,
  PreviewExcelImportCommand,
  SaveExcelImportProfileCommand,
} from '../excel.commands';
import { ExcelDeltaTranslateService } from '../excel-delta-translate.service';
import { ExcelJobRunnerService } from '../excel-job-runner.service';
import { ExcelQueueService } from '../../infrastructure/excel-queue.service';
import { ImportStorageService } from '../../infrastructure/import-storage.service';

function toExcelSessionDto(session: {
  id: string;
  projectId: string;
  sourceType: string;
  status: ImportSessionStatus;
  statsJson: unknown;
  warningsJson: unknown;
  excelLayoutJson: unknown;
  originalFilename: string | null;
  translationJobId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}) {
  const layout = session.excelLayoutJson as {
    sampleRows?: unknown[];
  } | null;

  return {
    id: session.id,
    projectId: session.projectId,
    sourceType: session.sourceType,
    status: session.status,
    stats: session.statsJson,
    warnings: session.warningsJson,
    sampleRows: layout?.sampleRows ?? [],
    originalFilename: session.originalFilename,
    translationJobId: session.translationJobId,
    errorMessage: session.errorMessage,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  };
}

@Injectable()
@CommandHandler(PreviewExcelImportCommand)
export class PreviewExcelImportHandler implements ICommandHandler<PreviewExcelImportCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly storage: ImportStorageService,
    private readonly excelJobRunner: ExcelJobRunnerService,
  ) {}

  async execute(command: PreviewExcelImportCommand) {
    if (command.buffer.length === 0) {
      throw new BadRequestException('Excel file is empty');
    }

    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: command.projectId },
      select: { excelImportProfile: true },
    });

    const savedProfile =
      project.excelImportProfile as ExcelImportProfile | null;
    const parseRules: ExcelParseRules = {
      preset:
        command.parseRules?.preset ?? savedProfile?.preset ?? 'wiz_classic',
      columnMapping:
        command.parseRules?.columnMapping ?? savedProfile?.columnMapping,
    };

    const session = await this.prisma.importSession.create({
      data: {
        tenantId: command.tenantId,
        projectId: command.projectId,
        userId: command.userId,
        sourceType: 'excel_delta',
        status: ImportSessionStatus.pending,
        parseRulesJson: parseRules as unknown as Prisma.InputJsonValue,
        originalFilename: command.filename,
      },
    });

    const storagePath = await this.storage.writeImportFile(
      command.tenantId,
      session.id,
      command.filename,
      command.buffer,
    );

    await this.prisma.importSession.update({
      where: { id: session.id },
      data: { storagePath },
    });

    const queued = await this.excelJobRunner.enqueueParseIfLarge(
      session.id,
      command.tenantId,
      command.buffer.length,
    );

    if (queued) {
      return { ...toExcelSessionDto(session), queued: true };
    }

    const updated = await this.prisma.importSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    return { ...toExcelSessionDto(updated), queued: false };
  }
}

@Injectable()
@CommandHandler(DeltaTranslateExcelImportCommand)
export class DeltaTranslateExcelImportHandler implements ICommandHandler<DeltaTranslateExcelImportCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly deltaTranslate: ExcelDeltaTranslateService,
  ) {}

  async execute(command: DeltaTranslateExcelImportCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const session = await this.prisma.importSession.findFirst({
      where: {
        id: command.sessionId,
        projectId: command.projectId,
        tenantId: command.tenantId,
        sourceType: 'excel_delta',
      },
    });

    if (!session) {
      throw new NotFoundException('Excel import session not found');
    }

    if (session.status !== ImportSessionStatus.preview_ready) {
      throw new BadRequestException(
        `Cannot start delta translate in status: ${session.status}`,
      );
    }

    const result = await this.deltaTranslate.startDeltaTranslate(
      command.sessionId,
      command.tenantId,
      command.projectId,
      command.userId,
      command.languages,
      command.provider,
    );

    return {
      sessionId: command.sessionId,
      jobId: result.jobId,
      itemCount: result.itemCount,
      status: 'translating',
    };
  }
}

@Injectable()
@QueryHandler(DownloadExcelImportQuery)
export class DownloadExcelImportHandler implements IQueryHandler<DownloadExcelImportQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly storage: ImportStorageService,
  ) {}

  async execute(query: DownloadExcelImportQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const session = await this.prisma.importSession.findFirst({
      where: {
        id: query.sessionId,
        projectId: query.projectId,
        tenantId: query.tenantId,
        sourceType: 'excel_delta',
      },
    });

    if (!session) {
      throw new NotFoundException('Excel import session not found');
    }

    if (session.status !== ImportSessionStatus.download_ready) {
      throw new NotFoundException('Excel output is not ready for download');
    }

    if (!session.outputStoragePath) {
      throw new NotFoundException('Output file is missing');
    }

    const content = await this.storage.readImportFile(
      session.outputStoragePath,
    );
    const filename =
      session.originalFilename?.replace(/\.xlsx?$/i, '-translated.xlsx') ??
      'translated-export.xlsx';

    return {
      content,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename,
    };
  }
}

@Injectable()
@QueryHandler(GetExcelImportSessionQuery)
export class GetExcelImportSessionHandler implements IQueryHandler<GetExcelImportSessionQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: GetExcelImportSessionQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const session = await this.prisma.importSession.findFirst({
      where: {
        id: query.sessionId,
        projectId: query.projectId,
        tenantId: query.tenantId,
        sourceType: 'excel_delta',
      },
    });

    if (!session) {
      throw new NotFoundException('Excel import session not found');
    }

    return toExcelSessionDto(session);
  }
}

@Injectable()
@CommandHandler(SaveExcelImportProfileCommand)
export class SaveExcelImportProfileHandler implements ICommandHandler<SaveExcelImportProfileCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: SaveExcelImportProfileCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    await this.prisma.project.update({
      where: { id: command.projectId },
      data: {
        excelImportProfile: command.profile as unknown as Prisma.InputJsonValue,
      },
    });

    return command.profile;
  }
}

@Injectable()
@QueryHandler(GetExcelImportProfileQuery)
export class GetExcelImportProfileHandler implements IQueryHandler<GetExcelImportProfileQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: GetExcelImportProfileQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: query.projectId },
      select: { excelImportProfile: true },
    });

    const saved = project.excelImportProfile as ExcelImportProfile | null;

    return (
      saved ?? {
        preset: 'wiz_classic' as const,
        columnMapping: WIZ_CLASSIC_PRESET,
      }
    );
  }
}

@Injectable()
@EventsHandler(TranslationJobCompletedEvent, TranslationJobFailedEvent)
export class ExcelComposeOnJobCompletedHandler
  implements
    IEventHandler<TranslationJobCompletedEvent>,
    IEventHandler<TranslationJobFailedEvent>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelQueue: ExcelQueueService,
  ) {}

  async handle(
    event: TranslationJobCompletedEvent | TranslationJobFailedEvent,
  ): Promise<void> {
    const session = await this.prisma.importSession.findFirst({
      where: {
        translationJobId: event.jobId,
        projectId: event.projectId,
        tenantId: event.tenantId,
        status: ImportSessionStatus.translating,
      },
    });

    if (!session) {
      return;
    }

    const pending = await this.prisma.translationJobItem.count({
      where: {
        jobId: event.jobId,
        status: { in: ['pending', 'processing'] },
      },
    });

    if (pending > 0) {
      return;
    }

    await this.excelQueue.enqueueCompose({
      sessionId: session.id,
      tenantId: event.tenantId,
    });
  }
}
