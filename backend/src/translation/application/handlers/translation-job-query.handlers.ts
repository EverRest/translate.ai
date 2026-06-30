import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { JobItemStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { GetJobStatusQuery, ListTranslationJobsQuery } from '../job.commands';
import { buildJobFailureSummary } from '../utils/job-failure-summary';

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
            translationKey: { select: { key: true } },
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

    return {
      id: job.id,
      projectId: job.projectId,
      status: job.status,
      provider: job.provider,
      progress: { total, completed, failed },
      failures,
      failedItems: failedItemDetails,
      createdAt: job.createdAt,
    };
  }
}
