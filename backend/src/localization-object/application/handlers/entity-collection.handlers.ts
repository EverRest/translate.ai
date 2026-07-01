import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LocalizationTemplateType } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  CreateEntityCollectionCommand,
  DeleteEntityCollectionCommand,
  ImportOpenApiCommand,
  ListEntityCollectionsQuery,
  PreviewOpenApiImportQuery,
  UpdateEntityCollectionCommand,
} from '../entity-collection.commands';
import {
  DEFAULT_COLLECTION_SLUG,
  ensureDefaultCollection,
} from '../../domain/ensure-default-collection';
import { parseOpenApiSpec } from '../../domain/openapi-to-structure.parser';
import { applyStructureTree } from '../services/apply-structure-tree.service';
import { MaterializeObjectService } from '../services/materialize-object.service';
import { OpenApiImportQueueService } from '../../infrastructure/openapi-import-queue.service';

async function ensureCollection(
  prisma: PrismaService,
  projectId: string,
  collectionId: string,
) {
  const collection = await prisma.entityCollection.findFirst({
    where: { id: collectionId, projectId },
  });
  if (!collection) {
    throw new NotFoundException('Entity collection not found');
  }
  return collection;
}

@Injectable()
@CommandHandler(CreateEntityCollectionCommand)
export class CreateEntityCollectionHandler implements ICommandHandler<CreateEntityCollectionCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: CreateEntityCollectionCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    try {
      const collection = await this.prisma.entityCollection.create({
        data: {
          projectId: command.projectId,
          slug: command.slug,
          name: command.name,
          description: command.description,
        },
        include: { _count: { select: { localizationObjects: true } } },
      });
      return {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        entityCount: collection._count.localizationObjects,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      };
    } catch {
      throw new ConflictException('Collection slug already exists');
    }
  }
}

@Injectable()
@CommandHandler(UpdateEntityCollectionCommand)
export class UpdateEntityCollectionHandler implements ICommandHandler<UpdateEntityCollectionCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: UpdateEntityCollectionCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    await ensureCollection(
      this.prisma,
      command.projectId,
      command.collectionId,
    );

    const collection = await this.prisma.entityCollection.update({
      where: { id: command.collectionId },
      data: {
        ...(command.name !== undefined ? { name: command.name } : {}),
        ...(command.description !== undefined
          ? { description: command.description }
          : {}),
      },
      include: { _count: { select: { localizationObjects: true } } },
    });

    return {
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      entityCount: collection._count.localizationObjects,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }
}

@Injectable()
@CommandHandler(DeleteEntityCollectionCommand)
export class DeleteEntityCollectionHandler implements ICommandHandler<DeleteEntityCollectionCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: DeleteEntityCollectionCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const collection = await ensureCollection(
      this.prisma,
      command.projectId,
      command.collectionId,
    );
    if (collection.slug === DEFAULT_COLLECTION_SLUG) {
      throw new BadRequestException(
        'Cannot delete the default General collection',
      );
    }

    const generalId = await ensureDefaultCollection(
      this.prisma,
      command.projectId,
    );

    await this.prisma.$transaction([
      this.prisma.localizationObject.updateMany({
        where: { collectionId: command.collectionId },
        data: { collectionId: generalId },
      }),
      this.prisma.entityCollection.delete({
        where: { id: command.collectionId },
      }),
    ]);

    return { deleted: true };
  }
}

@Injectable()
@QueryHandler(ListEntityCollectionsQuery)
export class ListEntityCollectionsHandler implements IQueryHandler<ListEntityCollectionsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListEntityCollectionsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    await ensureDefaultCollection(this.prisma, query.projectId);

    const collections = await this.prisma.entityCollection.findMany({
      where: { projectId: query.projectId },
      orderBy: [{ slug: 'asc' }],
      include: { _count: { select: { localizationObjects: true } } },
    });

    return {
      items: collections.map((collection) => ({
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        entityCount: collection._count.localizationObjects,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      })),
    };
  }
}

@Injectable()
@QueryHandler(PreviewOpenApiImportQuery)
export class PreviewOpenApiImportHandler implements IQueryHandler<PreviewOpenApiImportQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: PreviewOpenApiImportQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    await ensureCollection(this.prisma, query.projectId, query.collectionId);

    const parsed = parseOpenApiSpec(query.spec, query.selectedTags);
    return {
      entities: parsed.entities.map((entity) => ({
        name: entity.name,
        slug: entity.slug,
        tag: entity.tag,
        nodeCount: entity.nodeCount,
        previewTree: entity.nodes,
      })),
      warnings: parsed.warnings,
      availableTags: parsed.availableTags,
    };
  }
}

@Injectable()
@CommandHandler(ImportOpenApiCommand)
export class ImportOpenApiHandler implements ICommandHandler<ImportOpenApiCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly materializeService: MaterializeObjectService,
    private readonly openapiQueue: OpenApiImportQueueService,
  ) {}

  async execute(command: ImportOpenApiCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    await ensureCollection(
      this.prisma,
      command.projectId,
      command.collectionId,
    );

    const parsed = parseOpenApiSpec(command.spec, command.selectedTags);
    if (parsed.entities.length === 0) {
      throw new BadRequestException('No entities to import from spec');
    }

    const totalNodes = parsed.entities.reduce((sum, e) => sum + e.nodeCount, 0);
    if (totalNodes > 200) {
      await this.openapiQueue.enqueue({
        tenantId: command.tenantId,
        projectId: command.projectId,
        collectionId: command.collectionId,
        spec: command.spec,
        selectedTags: command.selectedTags,
        materialize: command.materialize,
      });
      return { queued: true, entityCount: parsed.entities.length };
    }

    return this.importSync(command, parsed.entities);
  }

  private async importSync(
    command: ImportOpenApiCommand,
    entities: ReturnType<typeof parseOpenApiSpec>['entities'],
  ) {
    const createdIds: string[] = [];

    for (const entity of entities) {
      let object;
      try {
        object = await this.prisma.localizationObject.create({
          data: {
            projectId: command.projectId,
            collectionId: command.collectionId,
            slug: entity.slug,
            name: entity.name,
            templateType: LocalizationTemplateType.api,
            description: `Imported from OpenAPI tag: ${entity.tag}`,
          },
        });
      } catch {
        throw new ConflictException(
          `Entity slug "${entity.slug}" already exists in project`,
        );
      }

      await applyStructureTree(this.prisma, object.id, entity.nodes);
      if (command.materialize) {
        await this.materializeService.materialize(
          command.projectId,
          object.id,
          {
            prune: false,
          },
        );
      }
      createdIds.push(object.id);
    }

    return {
      queued: false,
      entityCount: createdIds.length,
      entityIds: createdIds,
    };
  }
}
