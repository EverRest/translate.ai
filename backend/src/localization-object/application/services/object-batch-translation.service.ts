import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobItemStatus, JobStatus, TranslationJobMode } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { isValidLanguageCode } from '../../../shared/utils/string.utils';
import { resolveJobAiProvider } from '../../../ai-provider/domain/ai-provider.utils';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { TranslationJobRunnerService } from '../../../translation/application/services/translation-job-runner.service';
import { TranslationQueueService } from '../../../translation/infrastructure/translation-queue.service';
import { buildTreeFromNodes } from '../../domain/build-tree.utils';
import { groupLeavesByFieldNodeFromTree } from '../../domain/group-field-batches.utils';
import { MaterializeObjectService } from './materialize-object.service';

type ObjectBatchJobItemInput = {
  translationKeyId: string;
  language: string;
  batchGroupId: string;
};

@Injectable()
export class ObjectBatchTranslationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly materialize: MaterializeObjectService,
    private readonly config: ConfigService,
    private readonly queue: TranslationQueueService,
    private readonly jobRunner: TranslationJobRunnerService,
  ) {}

  async createBatchJob(
    tenantId: string,
    projectId: string,
    objectIds: string[],
    languages: string[],
    createdById?: string,
  ) {
    await this.projectAccess.getProjectForTenant(tenantId, projectId);

    const uniqueObjectIds = [...new Set(objectIds)];
    if (uniqueObjectIds.length === 0) {
      throw new BadRequestException('Provide at least one objectId');
    }

    const normalizedLanguages = languages.map((code) => code.toLowerCase());
    for (const code of normalizedLanguages) {
      if (!isValidLanguageCode(code)) {
        throw new BadRequestException(`Invalid language code: ${code}`);
      }
    }

    await this.prisma.projectLanguage.createMany({
      data: normalizedLanguages.map((code) => ({ projectId, code })),
      skipDuplicates: true,
    });

    const jobItems: ObjectBatchJobItemInput[] = [];

    for (const objectId of uniqueObjectIds) {
      const object = await this.prisma.localizationObject.findFirst({
        where: { id: objectId, projectId },
      });
      if (!object) {
        throw new NotFoundException(
          `Localization object not found: ${objectId}`,
        );
      }

      await this.materialize.materialize(projectId, objectId);

      const nodes = await this.prisma.localizationNode.findMany({
        where: { objectId },
        orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
      });

      const tree = buildTreeFromNodes(nodes);
      const batches = groupLeavesByFieldNodeFromTree(
        object.slug,
        tree.map((node) => ({
          id: node.id,
          slug: node.slug,
          nodeType: node.nodeType,
          sourceText: node.sourceText,
          description: node.description,
          context: node.context,
          contentType: node.contentType,
          children: mapChildren(node.children),
        })),
      );

      if (batches.length === 0) {
        throw new BadRequestException(
          `No translatable leaves in object ${object.slug}`,
        );
      }

      const keys = await this.prisma.translationKey.findMany({
        where: { localizationObjectId: objectId },
        select: { id: true, key: true },
      });
      const keyByPath = new Map(keys.map((row) => [row.key, row.id]));

      for (const batch of batches) {
        for (const leaf of batch.leaves) {
          const translationKeyId = keyByPath.get(leaf.path);
          if (!translationKeyId) {
            throw new BadRequestException(
              `Materialized key missing for ${leaf.path}`,
            );
          }

          for (const language of normalizedLanguages) {
            jobItems.push({
              translationKeyId,
              language,
              batchGroupId: batch.batchGroupId,
            });
          }
        }
      }
    }

    const provider = resolveJobAiProvider(
      undefined,
      this.config.get<string>('AI_PROVIDER', 'gemini'),
    );

    const job = await this.prisma.translationJob.create({
      data: {
        projectId,
        provider,
        status: JobStatus.pending,
        mode: TranslationJobMode.object_batch,
        metadata: { objectIds: uniqueObjectIds },
        createdById,
        items: {
          create: jobItems.map((item) => ({
            translationKeyId: item.translationKeyId,
            language: item.language,
            batchGroupId: item.batchGroupId,
            status: JobItemStatus.pending,
          })),
        },
      },
    });

    this.jobRunner.publishJobCreated(job.id, projectId, tenantId);

    await this.queue.enqueueCreate({
      jobId: job.id,
      tenantId,
    });

    return { jobId: job.id, status: job.status };
  }
}

function mapChildren(
  children: ReturnType<typeof buildTreeFromNodes>,
): Parameters<typeof groupLeavesByFieldNodeFromTree>[1] {
  return children.map((node) => ({
    id: node.id,
    slug: node.slug,
    nodeType: node.nodeType,
    sourceText: node.sourceText,
    description: node.description,
    context: node.context,
    contentType: node.contentType,
    children: mapChildren(node.children),
  }));
}
