import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GlossarySuggestionStatus } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { GlossaryAnalyzeService } from '../glossary-analyze.service';
import {
  AnalyzeGlossaryCommand,
  ApproveGlossarySuggestionCommand,
  ListGlossarySuggestionsQuery,
  RejectGlossarySuggestionCommand,
} from '../glossary-suggestion.commands';
import { GlossaryService } from '../glossary.service';
import { GlossaryQueueService } from '../../infrastructure/glossary-queue.service';

function mapSuggestion(suggestion: {
  id: string;
  sourceTerm: string;
  targetTerm: string | null;
  doNotTranslate: boolean;
  confidence: number;
  reason: string | null;
  status: GlossarySuggestionStatus;
  createdAt: Date;
  reviewedAt: Date | null;
}) {
  return {
    id: suggestion.id,
    sourceTerm: suggestion.sourceTerm,
    targetTerm: suggestion.targetTerm,
    doNotTranslate: suggestion.doNotTranslate,
    confidence: suggestion.confidence,
    reason: suggestion.reason,
    status: suggestion.status,
    createdAt: suggestion.createdAt,
    reviewedAt: suggestion.reviewedAt,
  };
}

@Injectable()
@CommandHandler(AnalyzeGlossaryCommand)
export class AnalyzeGlossaryHandler implements ICommandHandler<AnalyzeGlossaryCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly analyzeService: GlossaryAnalyzeService,
    private readonly glossaryQueue: GlossaryQueueService,
  ) {}

  async execute(command: AnalyzeGlossaryCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const translationCount = await this.analyzeService.countTranslations(
      command.projectId,
    );
    const minimum = this.analyzeService.minTranslations();
    if (translationCount < minimum) {
      throw new BadRequestException(
        `At least ${minimum} translations are required for glossary analysis`,
      );
    }

    await this.glossaryQueue.enqueueAnalyze({
      projectId: command.projectId,
      tenantId: command.tenantId,
    });

    return { queued: true, translationCount };
  }
}

@Injectable()
@CommandHandler(ApproveGlossarySuggestionCommand)
export class ApproveGlossarySuggestionHandler implements ICommandHandler<ApproveGlossarySuggestionCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async execute(command: ApproveGlossarySuggestionCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const suggestion = await this.prisma.glossarySuggestion.findFirst({
      where: {
        id: command.suggestionId,
        projectId: command.projectId,
        status: GlossarySuggestionStatus.pending,
      },
    });
    if (!suggestion) {
      throw new NotFoundException('Glossary suggestion not found');
    }

    const { term } = await this.prisma.$transaction(async (tx) => {
      const upserted = await this.glossaryService.upsertTerm(
        command.projectId,
        {
          sourceTerm: suggestion.sourceTerm,
          targetTerm: suggestion.doNotTranslate ? null : suggestion.targetTerm,
          doNotTranslate: suggestion.doNotTranslate,
          note: suggestion.reason ? `Suggested: ${suggestion.reason}` : null,
        },
        tx,
      );

      await tx.glossarySuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: GlossarySuggestionStatus.approved,
          reviewedAt: new Date(),
        },
      });

      return upserted;
    });

    return {
      suggestion: mapSuggestion({
        ...suggestion,
        status: GlossarySuggestionStatus.approved,
        reviewedAt: new Date(),
      }),
      term,
    };
  }
}

@Injectable()
@CommandHandler(RejectGlossarySuggestionCommand)
export class RejectGlossarySuggestionHandler implements ICommandHandler<RejectGlossarySuggestionCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: RejectGlossarySuggestionCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const result = await this.prisma.glossarySuggestion.updateMany({
      where: {
        id: command.suggestionId,
        projectId: command.projectId,
        status: GlossarySuggestionStatus.pending,
      },
      data: {
        status: GlossarySuggestionStatus.rejected,
        reviewedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Glossary suggestion not found');
    }

    return { rejected: true };
  }
}

@Injectable()
@QueryHandler(ListGlossarySuggestionsQuery)
export class ListGlossarySuggestionsHandler implements IQueryHandler<ListGlossarySuggestionsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListGlossarySuggestionsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const items = await this.prisma.glossarySuggestion.findMany({
      where: {
        projectId: query.projectId,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: [{ confidence: 'desc' }, { sourceTerm: 'asc' }],
    });

    return { items: items.map(mapSuggestion) };
  }
}
