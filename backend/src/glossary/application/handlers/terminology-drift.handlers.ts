import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TerminologyIssueStatus } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateTranslationJobCommand } from '../../../translation/application/job.commands';
import {
  DismissTerminologyIssueCommand,
  ListTerminologyIssuesQuery,
  ResolveTerminologyIssueCommand,
  ScanTerminologyCommand,
} from '../terminology-drift.commands';
import { GlossaryService } from '../glossary.service';
import { TerminologyDriftService } from '../terminology-drift.service';
import { TerminologyQueueService } from '../../infrastructure/terminology-queue.service';
import type { DriftVariant } from '../terminology-drift.utils';

@Injectable()
@CommandHandler(ScanTerminologyCommand)
export class ScanTerminologyHandler implements ICommandHandler<ScanTerminologyCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly terminologyQueue: TerminologyQueueService,
  ) {}

  async execute(command: ScanTerminologyCommand) {
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
@QueryHandler(ListTerminologyIssuesQuery)
export class ListTerminologyIssuesHandler implements IQueryHandler<ListTerminologyIssuesQuery> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly driftService: TerminologyDriftService,
  ) {}

  async execute(query: ListTerminologyIssuesQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const items = await this.driftService.listIssues(
      query.projectId,
      query.status,
    );
    return { items };
  }
}

@Injectable()
@CommandHandler(ResolveTerminologyIssueCommand)
export class ResolveTerminologyIssueHandler implements ICommandHandler<ResolveTerminologyIssueCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: ResolveTerminologyIssueCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const issue = await this.prisma.terminologyIssue.findFirst({
      where: {
        id: command.issueId,
        projectId: command.projectId,
        status: TerminologyIssueStatus.open,
      },
    });
    if (!issue) {
      throw new NotFoundException('Terminology issue not found');
    }

    if (command.addToGlossary) {
      await this.glossaryService.upsertTerm(command.projectId, {
        sourceTerm: issue.sourceTerm,
        targetTerm: command.canonicalValue,
        note: `preferred for ${issue.language}`,
      });
    }

    let retranslateJobId: string | undefined;
    if (command.retranslate) {
      const variants = issue.variants as DriftVariant[];
      const keyIds = [...new Set(variants.flatMap((variant) => variant.keyIds))];
      const keys = await this.prisma.translationKey.findMany({
        where: { id: { in: keyIds }, projectId: command.projectId },
        select: { key: true },
      });

      if (keys.length > 0) {
        const job = await this.commandBus.execute(
          new CreateTranslationJobCommand(
            command.tenantId,
            command.projectId,
            [issue.language],
            keys.map((row) => row.key),
            undefined,
            undefined,
            undefined,
            command.createdById,
          ),
        );
        retranslateJobId = (job as { jobId: string }).jobId;
      }
    }

    await this.prisma.terminologyIssue.update({
      where: { id: issue.id },
      data: {
        status: TerminologyIssueStatus.resolved,
        resolvedAt: new Date(),
      },
    });

    return { resolved: true, retranslateJobId };
  }
}

@Injectable()
@CommandHandler(DismissTerminologyIssueCommand)
export class DismissTerminologyIssueHandler implements ICommandHandler<DismissTerminologyIssueCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: DismissTerminologyIssueCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const result = await this.prisma.terminologyIssue.updateMany({
      where: {
        id: command.issueId,
        projectId: command.projectId,
        status: TerminologyIssueStatus.open,
      },
      data: { status: TerminologyIssueStatus.dismissed },
    });

    if (result.count === 0) {
      throw new NotFoundException('Terminology issue not found');
    }

    return { dismissed: true };
  }
}
