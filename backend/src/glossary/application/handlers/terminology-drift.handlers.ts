import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TerminologyDriftIssueStatus } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  CountTerminologyDriftIssuesQuery,
  GetTerminologyDriftKeyHintsQuery,
  ListTerminologyDriftIssuesQuery,
  ResolveTerminologyDriftIssueCommand,
  ScanTerminologyDriftCommand,
} from '../terminology-drift.commands';
import { TerminologyDriftService } from '../terminology-drift.service';
import { GlossaryService } from '../glossary.service';
import { TerminologyQueueService } from '../../infrastructure/terminology-queue.service';

@Injectable()
@CommandHandler(ScanTerminologyDriftCommand)
export class ScanTerminologyDriftHandler implements ICommandHandler<ScanTerminologyDriftCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly terminologyQueue: TerminologyQueueService,
  ) {}

  async execute(command: ScanTerminologyDriftCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    await this.terminologyQueue.enqueueScan({
      projectId: command.projectId,
      tenantId: command.tenantId,
    });

    return { queued: true };
  }
}

@Injectable()
@CommandHandler(ResolveTerminologyDriftIssueCommand)
export class ResolveTerminologyDriftIssueHandler implements ICommandHandler<ResolveTerminologyDriftIssueCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
    private readonly driftService: TerminologyDriftService,
  ) {}

  async execute(command: ResolveTerminologyDriftIssueCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const issue = await this.prisma.terminologyDriftIssue.findFirst({
      where: {
        id: command.issueId,
        projectId: command.projectId,
        status: TerminologyDriftIssueStatus.open,
      },
    });
    if (!issue) {
      throw new NotFoundException('Terminology drift issue not found');
    }

    const canonical = command.canonicalTranslation.trim();
    const variants = issue.variants as Array<{ translation: string }>;
    if (!variants.some((variant) => variant.translation === canonical)) {
      throw new NotFoundException(
        'Canonical translation must match one of the issue variants',
      );
    }

    const glossary = await this.glossaryService.ensureGlossary(
      command.projectId,
    );

    const term = await this.prisma.$transaction(async (tx) => {
      const upserted = await tx.glossaryTerm.upsert({
        where: {
          glossaryId_sourceTerm: {
            glossaryId: glossary.id,
            sourceTerm: issue.sourceTerm,
          },
        },
        create: {
          glossaryId: glossary.id,
          sourceTerm: issue.sourceTerm,
          targetTerm: canonical,
          doNotTranslate: false,
          note: `Resolved terminology drift (${issue.targetLang})`,
        },
        update: {
          targetTerm: canonical,
          doNotTranslate: false,
        },
      });

      const resolved = await tx.terminologyDriftIssue.update({
        where: { id: issue.id },
        data: {
          status: TerminologyDriftIssueStatus.resolved,
          canonicalTranslation: canonical,
          resolvedAt: new Date(),
        },
      });

      return { term: upserted, issue: resolved };
    });

    return {
      issue: this.driftService.mapIssue(term.issue),
      term: {
        id: term.term.id,
        sourceTerm: term.term.sourceTerm,
        targetTerm: term.term.targetTerm,
        doNotTranslate: term.term.doNotTranslate,
        note: term.term.note,
      },
    };
  }
}

@Injectable()
@QueryHandler(ListTerminologyDriftIssuesQuery)
export class ListTerminologyDriftIssuesHandler implements IQueryHandler<ListTerminologyDriftIssuesQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly driftService: TerminologyDriftService,
  ) {}

  async execute(query: ListTerminologyDriftIssuesQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const items = await this.prisma.terminologyDriftIssue.findMany({
      where: {
        projectId: query.projectId,
        ...(query.status === 'all' ? {} : { status: query.status }),
      },
      orderBy: [{ detectedAt: 'desc' }, { sourceTerm: 'asc' }],
    });

    return { items: items.map((item) => this.driftService.mapIssue(item)) };
  }
}

@Injectable()
@QueryHandler(CountTerminologyDriftIssuesQuery)
export class CountTerminologyDriftIssuesHandler implements IQueryHandler<CountTerminologyDriftIssuesQuery> {
  constructor(
    private readonly driftService: TerminologyDriftService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: CountTerminologyDriftIssuesQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const count = await this.driftService.countOpenIssues(query.projectId);
    return { count };
  }
}

@Injectable()
@QueryHandler(GetTerminologyDriftKeyHintsQuery)
export class GetTerminologyDriftKeyHintsHandler implements IQueryHandler<GetTerminologyDriftKeyHintsQuery> {
  constructor(
    private readonly driftService: TerminologyDriftService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: GetTerminologyDriftKeyHintsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const keys = await this.driftService.getKeysInOpenIssues(query.projectId);
    return { keys };
  }
}
