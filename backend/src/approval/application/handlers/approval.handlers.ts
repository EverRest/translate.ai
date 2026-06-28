import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
  CommandBus,
} from '@nestjs/cqrs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import {
  QualityMetricSource,
  QualityVerdict,
  ReviewStatus,
  TranslationStatus,
} from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuditService } from '../../../audit/application/audit.service';
import { TranslationQualityService } from '../../../billing/application/translation-quality.service';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { CreateTranslationJobCommand } from '../../../translation/application/job.commands';
import { TranslationMemoryService } from '../../../translation/application/services/translation-memory.service';
import { TranslationAccessService } from '../../infrastructure/translation-access.service';
import {
  TranslationApprovedEvent,
  TranslationPublishedEvent,
  TranslationRejectedEvent,
} from '../../domain/events/translation-approval.events';
import {
  ApproveTranslationCommand,
  BulkApproveTranslationsCommand,
  ListProjectReviewsQuery,
  PublishTranslationCommand,
  RejectTranslationCommand,
  RetranslateTranslationCommand,
  UpdateTranslationValueCommand,
} from '../approval.commands';

@Injectable()
@QueryHandler(ListProjectReviewsQuery)
export class ListProjectReviewsHandler implements IQueryHandler<ListProjectReviewsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListProjectReviewsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const statuses =
      query.status === 'approved'
        ? [TranslationStatus.approved]
        : [TranslationStatus.draft, TranslationStatus.review];

    const where = {
      translationKey: { projectId: query.projectId },
      status: { in: statuses },
    };

    const [items, total] = await Promise.all([
      this.prisma.translation.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { translationKey: { key: 'asc' } },
        include: {
          translationKey: { select: { key: true, sourceText: true } },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { reviewer: { select: { email: true } } },
          },
        },
      }),
      this.prisma.translation.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        key: t.translationKey.key,
        sourceText: t.translationKey.sourceText,
        language: t.language,
        value: t.value,
        status: t.status,
        version: t.version,
        reviewer: t.reviews[0]?.reviewer.email ?? null,
      })),
      meta: { page: query.page, limit: query.limit, total },
    };
  }
}

@Injectable()
@CommandHandler(ApproveTranslationCommand)
export class ApproveTranslationHandler implements ICommandHandler<ApproveTranslationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TranslationAccessService,
    private readonly audit: AuditService,
    private readonly eventBus: EventBus,
    private readonly quality: TranslationQualityService,
  ) {}

  async execute(command: ApproveTranslationCommand) {
    const translation = await this.access.getTranslationForTenant(
      command.tenantId,
      command.translationId,
    );

    if (translation.status === TranslationStatus.published) {
      throw new BadRequestException('Translation is already published');
    }

    const updated = await this.prisma.translation.update({
      where: { id: translation.id },
      data: { status: TranslationStatus.approved },
    });

    await this.prisma.review.create({
      data: {
        translationId: translation.id,
        reviewerId: command.userId,
        status: ReviewStatus.approved,
      },
    });

    await this.audit.log({
      tenantId: command.tenantId,
      userId: command.userId,
      entity: 'translation',
      entityId: translation.id,
      action: 'approved',
      payload: {
        key: translation.translationKey.key,
        language: translation.language,
      },
    });

    await this.quality.record({
      tenantId: command.tenantId,
      projectId: translation.translationKey.projectId,
      translationId: translation.id,
      language: translation.language,
      translationKey: translation.translationKey.key,
      sourceText: translation.translationKey.sourceText,
      aiValue: translation.value,
      score: 1,
      verdict: QualityVerdict.accurate,
      source: QualityMetricSource.review,
      provider: translation.provider ?? undefined,
      createdById: command.userId,
    });

    this.eventBus.publish(
      new TranslationApprovedEvent(
        translation.id,
        translation.translationKey.projectId,
        command.tenantId,
      ),
    );

    return updated;
  }
}

@Injectable()
@CommandHandler(RejectTranslationCommand)
export class RejectTranslationHandler implements ICommandHandler<RejectTranslationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TranslationAccessService,
    private readonly audit: AuditService,
    private readonly eventBus: EventBus,
    private readonly quality: TranslationQualityService,
  ) {}

  async execute(command: RejectTranslationCommand) {
    const translation = await this.access.getTranslationForTenant(
      command.tenantId,
      command.translationId,
    );

    const updated = await this.prisma.translation.update({
      where: { id: translation.id },
      data: { status: TranslationStatus.draft },
    });

    await this.prisma.review.create({
      data: {
        translationId: translation.id,
        reviewerId: command.userId,
        status: ReviewStatus.rejected,
        comment: command.comment,
      },
    });

    await this.audit.log({
      tenantId: command.tenantId,
      userId: command.userId,
      entity: 'translation',
      entityId: translation.id,
      action: 'rejected',
      payload: { comment: command.comment },
    });

    await this.quality.record({
      tenantId: command.tenantId,
      projectId: translation.translationKey.projectId,
      translationId: translation.id,
      language: translation.language,
      translationKey: translation.translationKey.key,
      sourceText: translation.translationKey.sourceText,
      aiValue: translation.value,
      score: 0,
      verdict: QualityVerdict.inaccurate,
      source: QualityMetricSource.review,
      notes: command.comment,
      provider: translation.provider ?? undefined,
      createdById: command.userId,
    });

    this.eventBus.publish(
      new TranslationRejectedEvent(
        translation.id,
        translation.translationKey.projectId,
        command.tenantId,
      ),
    );

    return updated;
  }
}

@Injectable()
@CommandHandler(PublishTranslationCommand)
export class PublishTranslationHandler implements ICommandHandler<PublishTranslationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TranslationAccessService,
    private readonly audit: AuditService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PublishTranslationCommand) {
    const translation = await this.access.getTranslationForTenant(
      command.tenantId,
      command.translationId,
    );

    if (translation.status !== TranslationStatus.approved) {
      throw new BadRequestException(
        'Translation must be approved before publish',
      );
    }

    const updated = await this.prisma.translation.update({
      where: { id: translation.id },
      data: { status: TranslationStatus.published },
    });

    await this.audit.log({
      tenantId: command.tenantId,
      userId: command.userId,
      entity: 'translation',
      entityId: translation.id,
      action: 'published',
      payload: {
        key: translation.translationKey.key,
        language: translation.language,
      },
    });

    this.eventBus.publish(
      new TranslationPublishedEvent(
        translation.id,
        translation.translationKey.projectId,
        command.tenantId,
        translation.translationKey.key,
        translation.language,
      ),
    );

    return updated;
  }
}

@Injectable()
@CommandHandler(UpdateTranslationValueCommand)
export class UpdateTranslationValueHandler implements ICommandHandler<UpdateTranslationValueCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TranslationAccessService,
    private readonly audit: AuditService,
    private readonly quality: TranslationQualityService,
  ) {}

  async execute(command: UpdateTranslationValueCommand) {
    const translation = await this.access.getTranslationForTenant(
      command.tenantId,
      command.translationId,
    );

    if (translation.status === TranslationStatus.published) {
      throw new BadRequestException('Published translations cannot be edited');
    }

    const aiValue = translation.value;

    const updated = await this.prisma.translation.update({
      where: { id: translation.id },
      data: {
        value: command.value,
        status: TranslationStatus.review,
        version: translation.version + 1,
      },
    });

    await this.audit.log({
      tenantId: command.tenantId,
      userId: command.userId,
      entity: 'translation',
      entityId: translation.id,
      action: 'value_updated',
      payload: { version: updated.version },
    });

    await this.quality.record({
      tenantId: command.tenantId,
      projectId: translation.translationKey.projectId,
      translationId: translation.id,
      language: translation.language,
      translationKey: translation.translationKey.key,
      sourceText: translation.translationKey.sourceText,
      aiValue,
      referenceValue: command.value,
      source: QualityMetricSource.editor,
      provider: translation.provider ?? undefined,
      createdById: command.userId,
    });

    return updated;
  }
}

@Injectable()
@CommandHandler(BulkApproveTranslationsCommand)
export class BulkApproveTranslationsHandler implements ICommandHandler<BulkApproveTranslationsCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly audit: AuditService,
    private readonly quality: TranslationQualityService,
  ) {}

  async execute(command: BulkApproveTranslationsCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const results = [];
    for (const translationId of command.translationIds) {
      const translation = await this.prisma.translation.findFirst({
        where: {
          id: translationId,
          translationKey: {
            projectId: command.projectId,
            project: { tenantId: command.tenantId },
          },
        },
        include: {
          translationKey: { select: { key: true, sourceText: true } },
        },
      });
      if (!translation || translation.status === TranslationStatus.published) {
        continue;
      }

      const updated = await this.prisma.translation.update({
        where: { id: translation.id },
        data: { status: TranslationStatus.approved },
      });

      await this.prisma.review.create({
        data: {
          translationId: translation.id,
          reviewerId: command.userId,
          status: ReviewStatus.approved,
        },
      });

      await this.quality.record({
        tenantId: command.tenantId,
        projectId: command.projectId,
        translationId: translation.id,
        language: translation.language,
        translationKey: translation.translationKey.key,
        sourceText: translation.translationKey.sourceText,
        aiValue: translation.value,
        score: 1,
        verdict: QualityVerdict.accurate,
        source: QualityMetricSource.review,
        provider: translation.provider ?? undefined,
        createdById: command.userId,
      });

      results.push(updated);
    }

    await this.audit.log({
      tenantId: command.tenantId,
      userId: command.userId,
      entity: 'project',
      entityId: command.projectId,
      action: 'bulk_approve',
      payload: { count: results.length },
    });

    return { approved: results.length, items: results };
  }
}

@Injectable()
@CommandHandler(RetranslateTranslationCommand)
export class RetranslateTranslationHandler implements ICommandHandler<RetranslateTranslationCommand> {
  constructor(
    private readonly access: TranslationAccessService,
    private readonly memory: TranslationMemoryService,
    private readonly commandBus: CommandBus,
    private readonly config: ConfigService,
  ) {}

  async execute(command: RetranslateTranslationCommand) {
    const translation = await this.access.getTranslationForTenant(
      command.tenantId,
      command.translationId,
    );

    if (translation.status === TranslationStatus.published) {
      throw new BadRequestException(
        'Published translations cannot be re-translated',
      );
    }

    const sourceText = translation.translationKey.sourceText;
    if (!sourceText?.trim()) {
      throw new BadRequestException('Translation key has empty source text');
    }

    const sourceLang = this.config.get<string>('DEFAULT_SOURCE_LANGUAGE', 'en');

    await this.memory.forget(
      command.tenantId,
      sourceText,
      sourceLang,
      translation.language,
    );

    const provider = command.provider ?? translation.provider ?? 'openai';

    const job = await this.commandBus.execute(
      new CreateTranslationJobCommand(
        command.tenantId,
        translation.translationKey.projectId,
        [translation.language],
        [translation.translationKey.key],
        undefined,
        provider,
        undefined,
        command.userId,
      ),
    );

    return {
      jobId: job.jobId,
      translationId: translation.id,
      status: job.status,
    };
  }
}
