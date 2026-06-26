import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { JobItemStatus, JobStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  TranslationJobCompletedEvent,
  TranslationJobFailedEvent,
} from '../../domain/events/translation-job.events';

@Injectable()
export class JobCompletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async checkAndFinalize(jobId: string, tenantId: string): Promise<void> {
    const items = await this.prisma.translationJobItem.findMany({
      where: { jobId },
    });

    if (items.length === 0) {
      return;
    }

    const pending = items.filter(
      (i) =>
        i.status === JobItemStatus.pending ||
        i.status === JobItemStatus.processing,
    );
    if (pending.length > 0) {
      return;
    }

    const failed = items.filter((i) => i.status === JobItemStatus.failed);
    const job = await this.prisma.translationJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      return;
    }

    if (failed.length === items.length) {
      await this.prisma.translationJob.update({
        where: { id: jobId },
        data: { status: JobStatus.failed },
      });
      this.eventBus.publish(
        new TranslationJobFailedEvent(jobId, job.projectId, tenantId),
      );
      return;
    }

    const status = failed.length > 0 ? JobStatus.failed : JobStatus.completed;

    await this.prisma.translationJob.update({
      where: { id: jobId },
      data: {
        status: failed.length > 0 ? JobStatus.failed : JobStatus.completed,
      },
    });

    if (status === JobStatus.completed) {
      this.eventBus.publish(
        new TranslationJobCompletedEvent(jobId, job.projectId, tenantId),
      );
    } else {
      this.eventBus.publish(
        new TranslationJobFailedEvent(jobId, job.projectId, tenantId),
      );
    }
  }
}
