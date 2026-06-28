import { Injectable } from '@nestjs/common';
import { JobItemStatus, JobStatus } from '@prisma/client';
import { Observable } from 'rxjs';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export type SseTranslationEvent =
  | {
      type: 'translation';
      key: string;
      sourceText: string;
      language: string;
      value: string;
      status: string;
    }
  | { type: 'done'; jobStatus: string }
  | { type: 'error'; message: string };

@Injectable()
export class TranslationSseService {
  constructor(private readonly prisma: PrismaService) {}

  streamJob(
    jobId: string,
    projectId: string,
  ): Observable<{ data: SseTranslationEvent }> {
    return new Observable((subscriber) => {
      const seenItemIds = new Set<string>();

      const tick = async () => {
        try {
          const job = await this.prisma.translationJob.findUnique({
            where: { id: jobId, projectId },
          });

          if (!job) {
            subscriber.next({
              data: { type: 'error', message: 'Job not found' },
            });
            subscriber.complete();
            return;
          }

          const completedItems = await this.prisma.translationJobItem.findMany({
            where: { jobId, status: JobItemStatus.completed },
            include: {
              translationKey: { select: { key: true, sourceText: true } },
            },
          });

          for (const item of completedItems) {
            if (seenItemIds.has(item.id)) continue;
            seenItemIds.add(item.id);

            const translation = await this.prisma.translation.findFirst({
              where: {
                translationKeyId: item.translationKeyId,
                language: item.language,
              },
            });

            if (translation) {
              subscriber.next({
                data: {
                  type: 'translation',
                  key: item.translationKey.key,
                  sourceText: item.translationKey.sourceText,
                  language: item.language,
                  value: translation.value,
                  status: translation.status,
                },
              });
            }
          }

          const isDone =
            job.status === JobStatus.completed ||
            job.status === JobStatus.failed ||
            job.status === JobStatus.cancelled;

          if (isDone) {
            subscriber.next({ data: { type: 'done', jobStatus: job.status } });
            subscriber.complete();
          }
        } catch (err) {
          subscriber.next({
            data: { type: 'error', message: (err as Error).message },
          });
          subscriber.complete();
        }
      };

      const interval = setInterval(() => void tick(), 1000);

      return () => clearInterval(interval);
    });
  }
}
