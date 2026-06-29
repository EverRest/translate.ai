import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  BulkUpsertGlossaryTermsCommand,
  CreateGlossaryTermCommand,
  DeleteGlossaryTermCommand,
  ListGlossaryTermsQuery,
  UpdateGlossaryTermCommand,
  UpsertGlossaryTermCommand,
} from '../glossary.commands';
import { GlossaryService } from '../glossary.service';

function mapTerm(term: {
  id: string;
  sourceTerm: string;
  targetTerm: string | null;
  doNotTranslate: boolean;
  note: string | null;
  createdAt?: Date;
}) {
  return {
    id: term.id,
    sourceTerm: term.sourceTerm,
    targetTerm: term.targetTerm,
    doNotTranslate: term.doNotTranslate,
    note: term.note,
  };
}

@Injectable()
@CommandHandler(CreateGlossaryTermCommand)
export class CreateGlossaryTermHandler implements ICommandHandler<CreateGlossaryTermCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(command: CreateGlossaryTermCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const glossary = await this.glossaryService.getActiveGlossary(
      command.projectId,
    );

    try {
      const term = await this.prisma.glossaryTerm.create({
        data: {
          glossaryId: glossary.id,
          sourceTerm: command.sourceTerm.trim(),
          targetTerm: command.doNotTranslate
            ? null
            : command.targetTerm?.trim() || null,
          doNotTranslate: command.doNotTranslate,
          note: command.note?.trim() || null,
        },
      });
      return mapTerm(term);
    } catch {
      throw new ConflictException('Glossary term already exists');
    }
  }
}

@Injectable()
@CommandHandler(UpdateGlossaryTermCommand)
export class UpdateGlossaryTermHandler implements ICommandHandler<UpdateGlossaryTermCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: UpdateGlossaryTermCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const existing = await this.prisma.glossaryTerm.findFirst({
      where: {
        id: command.termId,
        glossary: { projectId: command.projectId },
      },
    });
    if (!existing) {
      throw new NotFoundException('Glossary term not found');
    }

    const doNotTranslate = command.doNotTranslate ?? existing.doNotTranslate;

    const term = await this.prisma.glossaryTerm.update({
      where: { id: command.termId },
      data: {
        ...(command.sourceTerm !== undefined
          ? { sourceTerm: command.sourceTerm.trim() }
          : {}),
        ...(command.doNotTranslate !== undefined
          ? { doNotTranslate: command.doNotTranslate }
          : {}),
        ...(command.targetTerm !== undefined ||
        command.doNotTranslate !== undefined
          ? {
              targetTerm: doNotTranslate
                ? null
                : (command.targetTerm ?? existing.targetTerm)?.trim() || null,
            }
          : {}),
        ...(command.note !== undefined
          ? { note: command.note?.trim() || null }
          : {}),
      },
    });

    return mapTerm(term);
  }
}

@Injectable()
@CommandHandler(UpsertGlossaryTermCommand)
export class UpsertGlossaryTermHandler implements ICommandHandler<UpsertGlossaryTermCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(command: UpsertGlossaryTermCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    return this.glossaryService.upsertTerm(command.projectId, {
      sourceTerm: command.sourceTerm,
      targetTerm: command.targetTerm,
      doNotTranslate: command.doNotTranslate,
      note: command.note,
    });
  }
}

@Injectable()
@CommandHandler(BulkUpsertGlossaryTermsCommand)
export class BulkUpsertGlossaryTermsHandler implements ICommandHandler<BulkUpsertGlossaryTermsCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(command: BulkUpsertGlossaryTermsCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    return this.glossaryService.bulkUpsertTerms(
      command.projectId,
      command.terms,
    );
  }
}

@Injectable()
@CommandHandler(DeleteGlossaryTermCommand)
export class DeleteGlossaryTermHandler implements ICommandHandler<DeleteGlossaryTermCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: DeleteGlossaryTermCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const result = await this.prisma.glossaryTerm.deleteMany({
      where: {
        id: command.termId,
        glossary: { projectId: command.projectId },
      },
    });
    if (result.count === 0) {
      throw new NotFoundException('Glossary term not found');
    }
    return { deleted: true };
  }
}

@Injectable()
@QueryHandler(ListGlossaryTermsQuery)
export class ListGlossaryTermsHandler implements IQueryHandler<ListGlossaryTermsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(query: ListGlossaryTermsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const glossary = await this.glossaryService.getGlossaryForProject(
      query.projectId,
      query.glossaryId,
    );

    const where: Prisma.GlossaryTermWhereInput = {
      glossaryId: glossary.id,
      ...(query.search
        ? {
            OR: [
              { sourceTerm: { contains: query.search, mode: 'insensitive' } },
              { targetTerm: { contains: query.search, mode: 'insensitive' } },
              { note: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.glossaryTerm.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { sourceTerm: 'asc' },
      }),
      this.prisma.glossaryTerm.count({ where }),
    ]);

    return {
      items: items.map(mapTerm),
      meta: { page: query.page, limit: query.limit, total },
    };
  }
}
