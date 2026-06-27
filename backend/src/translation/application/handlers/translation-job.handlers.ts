import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobItemStatus, JobStatus, TranslationKey } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { isValidLanguageCode } from '../../../shared/utils/string.utils';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { TranslationQueueService } from '../../infrastructure/translation-queue.service';
import { TranslationJobRunnerService } from '../services/translation-job-runner.service';
import {
  CancelTranslationJobCommand,
  CreateTranslationJobCommand,
  JobKeyItemInput,
  RetryTranslationJobCommand,
} from '../job.commands';

@Injectable()
@CommandHandler(CreateTranslationJobCommand)
export class CreateTranslationJobHandler implements ICommandHandler<CreateTranslationJobCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly queue: TranslationQueueService,
    private readonly jobRunner: TranslationJobRunnerService,
  ) {}

  async execute(command: CreateTranslationJobCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const languages = command.languages.map((l) => l.toLowerCase());
    for (const code of languages) {
      if (!isValidLanguageCode(code)) {
        throw new BadRequestException(`Invalid language code: ${code}`);
      }
    }

    await this.ensureProjectLanguages(command.projectId, languages);

    const translationKeys = await this.resolveTranslationKeys(
      command.projectId,
      command.keys,
      command.keyItems,
    );

    const provider = command.provider ?? 'openai';

    const job = await this.prisma.translationJob.create({
      data: {
        projectId: command.projectId,
        provider,
        status: JobStatus.pending,
        createdById: command.createdById,
        items: {
          create: translationKeys.flatMap((tk) =>
            languages.map((language) => ({
              translationKeyId: tk.id,
              language,
              status: JobItemStatus.pending,
            })),
          ),
        },
      },
    });

    this.jobRunner.publishJobCreated(
      job.id,
      command.projectId,
      command.tenantId,
    );

    await this.queue.enqueueCreate({
      jobId: job.id,
      tenantId: command.tenantId,
      correlationId: command.clientRequestId,
    });

    return { jobId: job.id, status: job.status };
  }

  private async ensureProjectLanguages(
    projectId: string,
    languages: string[],
  ): Promise<void> {
    await this.prisma.projectLanguage.createMany({
      data: languages.map((code) => ({
        projectId,
        code,
      })),
      skipDuplicates: true,
    });
  }

  private async resolveTranslationKeys(
    projectId: string,
    keys: string[],
    keyItems: JobKeyItemInput[] | undefined,
  ): Promise<TranslationKey[]> {
    const keyNames: string[] = [];
    const itemsByKey = new Map<string, JobKeyItemInput>();

    for (const key of keys) {
      if (!keyNames.includes(key)) {
        keyNames.push(key);
      }
    }

    for (const item of keyItems ?? []) {
      itemsByKey.set(item.key, item);
      if (!keyNames.includes(item.key)) {
        keyNames.push(item.key);
      }
    }

    if (keyNames.length === 0) {
      throw new BadRequestException(
        'Provide keys (existing catalog) or keyItems (inline API flow).',
      );
    }

    const existing = await this.prisma.translationKey.findMany({
      where: {
        projectId,
        key: { in: keyNames },
      },
    });
    const found = new Map(existing.map((item) => [item.key, item]));

    for (const keyName of keyNames) {
      if (found.has(keyName)) {
        continue;
      }

      const item = itemsByKey.get(keyName);
      if (!item?.sourceText) {
        throw new NotFoundException(
          `Translation key not found: ${keyName}. Add it on the Keys tab or include sourceText in keyItems.`,
        );
      }

      const created = await this.prisma.translationKey.create({
        data: {
          projectId,
          key: item.key,
          sourceText: item.sourceText,
          description: item.description,
          context: item.context,
          contentType: item.contentType,
        },
      });
      found.set(keyName, created);
    }

    return keyNames.map((keyName) => found.get(keyName)!);
  }
}

@Injectable()
@CommandHandler(RetryTranslationJobCommand)
export class RetryTranslationJobHandler implements ICommandHandler<RetryTranslationJobCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly queue: TranslationQueueService,
  ) {}

  async execute(command: RetryTranslationJobCommand) {
    const job = await this.prisma.translationJob.findUnique({
      where: { id: command.jobId },
      include: { project: true },
    });

    if (!job || job.project.tenantId !== command.tenantId) {
      throw new NotFoundException('Translation job not found');
    }
    if (
      command.scopedProjectId &&
      job.projectId !== command.scopedProjectId
    ) {
      throw new NotFoundException('Translation job not found');
    }

    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      job.projectId,
    );

    await this.queue.enqueueRetry({
      jobId: job.id,
      tenantId: command.tenantId,
    });

    return { jobId: job.id, status: 'retrying' };
  }
}

@Injectable()
@CommandHandler(CancelTranslationJobCommand)
export class CancelTranslationJobHandler implements ICommandHandler<CancelTranslationJobCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: CancelTranslationJobCommand) {
    const job = await this.prisma.translationJob.findUnique({
      where: { id: command.jobId },
      include: { project: true },
    });

    if (!job || job.project.tenantId !== command.tenantId) {
      throw new NotFoundException('Translation job not found');
    }
    if (
      command.scopedProjectId &&
      job.projectId !== command.scopedProjectId
    ) {
      throw new NotFoundException('Translation job not found');
    }

    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      job.projectId,
    );

    if (
      job.status === JobStatus.completed ||
      job.status === JobStatus.cancelled
    ) {
      throw new BadRequestException('Job cannot be cancelled');
    }

    await this.prisma.translationJob.update({
      where: { id: job.id },
      data: { status: JobStatus.cancelled },
    });

    return { jobId: job.id, status: JobStatus.cancelled };
  }
}
