import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { JobItemStatus, TranslationJobMode } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { GetJobStatusQuery, ListTranslationJobsQuery } from '../job.commands';
import { buildJobFailureSummary } from '../utils/job-failure-summary';
import { buildJobPlaceholderSummary } from '../utils/job-placeholder-summary';
import { computeObjectBatchProgress } from '../utils/object-batch-progress.utils';

@Injectable()
@QueryHandler(ListTranslationJobsQuery)
export class ListTranslationJobsHandler implements IQueryHandler<ListTranslationJobsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListTranslationJobsQuery) {
    const effectiveProjectId =
      query.scopedProjectId ?? query.projectId ?? undefined;

    const where = {
      project: {
        tenantId: query.tenantId,
        ...(effectiveProjectId ? { id: effectiveProjectId } : {}),
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.translationJob.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.translationJob.count({ where }),
    ]);

    return {
      items: items.map((job) => ({
        id: job.id,
        projectId: job.projectId,
        projectName: job.project.name,
        status: job.status,
        provider: job.provider,
        itemCount: job._count.items,
        createdAt: job.createdAt,
      })),
      meta: { page: query.page, limit: query.limit, total },
    };
  }
}

@Injectable()
@QueryHandler(GetJobStatusQuery)
export class GetJobStatusHandler implements IQueryHandler<GetJobStatusQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetJobStatusQuery) {
    const job = await this.prisma.translationJob.findFirst({
      where: {
        id: query.jobId,
        project: {
          tenantId: query.tenantId,
          ...(query.scopedProjectId ? { id: query.scopedProjectId } : {}),
        },
      },
      include: {
        items: {
          include: {
            translationKey: {
              select: {
                key: true,
                sourceText: true,
                localizationObjectId: true,
              },
            },
          },
        },
        project: { select: { id: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Translation job not found');
    }

    const total = job.items.length;
    const completed = job.items.filter(
      (i) => i.status === JobItemStatus.completed,
    ).length;
    const failedItems = job.items.filter(
      (i) => i.status === JobItemStatus.failed,
    );
    const failed = failedItems.length;
    const failures = buildJobFailureSummary(
      failedItems
        .map((item) => item.errorMessage)
        .filter((message): message is string => Boolean(message)),
      job.provider,
    );

    const failedItemDetails = failedItems.map((item) => ({
      key: item.translationKey.key,
      language: item.language,
      errorMessage: item.errorMessage,
    }));

    const placeholderSummary = buildJobPlaceholderSummary(
      job.items.map((item) => ({
        translationKeyId: item.translationKeyId,
        status: item.status,
        sourceText: item.translationKey.sourceText,
      })),
    );

    const objectIds =
      job.mode === TranslationJobMode.object_batch &&
      job.metadata &&
      typeof job.metadata === 'object' &&
      Array.isArray((job.metadata as { objectIds?: unknown }).objectIds)
        ? ((job.metadata as { objectIds: string[] }).objectIds ?? [])
        : [];

    const objectProgress =
      objectIds.length > 0
        ? computeObjectBatchProgress(objectIds, job.items)
        : undefined;

    return {
      id: job.id,
      projectId: job.projectId,
      status: job.status,
      provider: job.provider,
      mode: job.mode,
      progress: { total, completed, failed },
      ...(objectProgress ? { objectProgress } : {}),
      failures,
      failedItems: failedItemDetails,
      ...(placeholderSummary ? { placeholderSummary } : {}),
      createdAt: job.createdAt,
    };
  }
}
