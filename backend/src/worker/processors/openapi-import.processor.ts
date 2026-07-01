import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LocalizationTemplateType } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { QUEUES } from '../../shared/constants/queues';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { parseOpenApiSpec } from '../../localization-object/domain/openapi-to-structure.parser';
import { applyStructureTree } from '../../localization-object/application/services/apply-structure-tree.service';
import { MaterializeObjectService } from '../../localization-object/application/services/materialize-object.service';
import type { OpenApiImportJobPayload } from '../../localization-object/infrastructure/openapi-import-queue.service';

@Processor(QUEUES.INTEGRATION_OPENAPI_IMPORT)
export class OpenApiImportProcessor extends WorkerHost {
  private readonly logger = new Logger(OpenApiImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly materializeService: MaterializeObjectService,
  ) {
    super();
  }

  async process(job: Job<OpenApiImportJobPayload>): Promise<void> {
    const { projectId, collectionId, spec, selectedTags, materialize } =
      job.data;
    this.logger.log(
      `Processing ${QUEUES.INTEGRATION_OPENAPI_IMPORT} for project ${projectId}`,
    );

    const parsed = parseOpenApiSpec(spec, selectedTags);

    for (const entity of parsed.entities) {
      let object;
      try {
        object = await this.prisma.localizationObject.create({
          data: {
            projectId,
            collectionId,
            slug: entity.slug,
            name: entity.name,
            templateType: LocalizationTemplateType.api,
            description: `Imported from OpenAPI tag: ${entity.tag}`,
          },
        });
      } catch {
        throw new ConflictException(
          `Entity slug "${entity.slug}" already exists`,
        );
      }

      await applyStructureTree(this.prisma, object.id, entity.nodes);
      if (materialize) {
        await this.materializeService.materialize(projectId, object.id, {
          prune: false,
        });
      }
    }
  }
}
