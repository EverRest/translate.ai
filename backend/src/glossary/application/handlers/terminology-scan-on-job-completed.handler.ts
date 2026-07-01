import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { TranslationJobCompletedEvent } from '../../../translation/domain/events/translation-job.events';
import { TerminologyQueueService } from '../../infrastructure/terminology-queue.service';

@Injectable()
@EventsHandler(TranslationJobCompletedEvent)
export class TerminologyScanOnJobCompletedHandler implements IEventHandler<TranslationJobCompletedEvent> {
  private readonly logger = new Logger(
    TerminologyScanOnJobCompletedHandler.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly terminologyQueue: TerminologyQueueService,
  ) {}

  async handle(event: TranslationJobCompletedEvent): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: event.projectId, tenantId: event.tenantId },
      select: { autoTerminologyScan: true },
    });

    if (!project?.autoTerminologyScan) {
      return;
    }

    await this.terminologyQueue.enqueueScan({
      projectId: event.projectId,
      tenantId: event.tenantId,
    });

    this.logger.debug(
      `Enqueued terminology scan for project=${event.projectId} after job=${event.jobId}`,
    );
  }
}
