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
import { LocalizationNodeType, LocalizationTemplateType } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ObjectBatchTranslationService } from '../services/object-batch-translation.service';
import {
  CreateLocalizationNodeCommand,
  CreateLocalizationObjectCommand,
  DeleteLocalizationNodeCommand,
  DeleteLocalizationObjectCommand,
  GenerateLocalizationObjectStructureCommand,
  ApplyLocalizationObjectTemplateCommand,
  GetLocalizationObjectQuery,
  ListLocalizationObjectTemplatesQuery,
  ListLocalizationObjectsQuery,
  MaterializeLocalizationObjectCommand,
  TranslateLocalizationObjectCommand,
  TranslateObjectsBatchCommand,
  UpdateLocalizationNodeCommand,
  UpdateLocalizationObjectCommand,
} from '../localization-object.commands';
import { MaterializeObjectService } from '../services/materialize-object.service';
import { applyStructureTree } from '../services/apply-structure-tree.service';
import { LocalizationObjectQueueService } from '../../infrastructure/localization-object-queue.service';
import {
  getObjectTemplate,
  listObjectTemplates,
} from '../../domain/object-templates';
import {
  buildTreeFromNodes,
  type LocalizationNodeTree,
} from '../../domain/build-tree.utils';
import { ensureDefaultCollection } from '../../domain/ensure-default-collection';

function mapObjectSummary(
  object: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    templateType: LocalizationTemplateType;
    status: string;
    generationStatus: string;
    generationError: string | null;
    collectionId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { nodes: number };
    collection?: { id: string; name: string; slug: string } | null;
  },
  materializedCount?: number,
) {
  return {
    id: object.id,
    slug: object.slug,
    name: object.name,
    description: object.description,
    templateType: object.templateType,
    status: object.status,
    generationStatus: object.generationStatus,
    generationError: object.generationError,
    collectionId: object.collectionId,
    collectionName: object.collection?.name ?? null,
    collectionSlug: object.collection?.slug ?? null,
    nodeCount: object._count?.nodes ?? 0,
    materializedCount: materializedCount ?? 0,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt,
  };
}

function mapNode(node: {
  id: string;
  parentId: string | null;
  sortOrder: number;
  slug: string;
  nodeType: LocalizationNodeType;
  label: string | null;
  sourceText: string | null;
  description: string | null;
  context: string | null;
  contentType: string | null;
  translationKeyId: string | null;
}) {
  return {
    id: node.id,
    parentId: node.parentId,
    sortOrder: node.sortOrder,
    slug: node.slug,
    nodeType: node.nodeType,
    label: node.label,
    sourceText: node.sourceText,
    description: node.description,
    context: node.context,
    contentType: node.contentType,
    translationKeyId: node.translationKeyId,
  };
}

async function ensureObject(
  prisma: PrismaService,
  projectId: string,
  objectId: string,
) {
  const object = await prisma.localizationObject.findFirst({
    where: { id: objectId, projectId },
  });
  if (!object) {
    throw new NotFoundException('Localization object not found');
  }
  return object;
}

async function ensureSiblingSlugUnique(
  prisma: PrismaService,
  objectId: string,
  parentId: string | null | undefined,
  slug: string,
  excludeNodeId?: string,
) {
  const sibling = await prisma.localizationNode.findFirst({
    where: {
      objectId,
      parentId: parentId ?? null,
      slug,
      ...(excludeNodeId ? { NOT: { id: excludeNodeId } } : {}),
    },
  });
  if (sibling) {
    throw new ConflictException('Node slug already exists under this parent');
  }
}

@Injectable()
@CommandHandler(CreateLocalizationObjectCommand)
export class CreateLocalizationObjectHandler implements ICommandHandler<CreateLocalizationObjectCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: CreateLocalizationObjectCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    try {
      let collectionId = command.collectionId;
      if (!collectionId) {
        collectionId = await ensureDefaultCollection(
          this.prisma,
          command.projectId,
        );
      }

      const object = await this.prisma.localizationObject.create({
        data: {
          projectId: command.projectId,
          collectionId,
          slug: command.slug,
          name: command.name,
          description: command.description,
          templateType:
            (command.templateType as LocalizationTemplateType) ?? 'custom',
        },
        include: {
          _count: { select: { nodes: true } },
          collection: { select: { id: true, name: true, slug: true } },
        },
      });
      return mapObjectSummary(object);
    } catch {
      throw new ConflictException('Localization object slug already exists');
    }
  }
}

@Injectable()
@CommandHandler(UpdateLocalizationObjectCommand)
export class UpdateLocalizationObjectHandler implements ICommandHandler<UpdateLocalizationObjectCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: UpdateLocalizationObjectCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    await ensureObject(this.prisma, command.projectId, command.objectId);

    const object = await this.prisma.localizationObject.update({
      where: { id: command.objectId },
      data: {
        ...(command.name !== undefined ? { name: command.name } : {}),
        ...(command.description !== undefined
          ? { description: command.description }
          : {}),
        ...(command.templateType !== undefined
          ? {
              templateType: command.templateType as LocalizationTemplateType,
            }
          : {}),
        ...(command.collectionId !== undefined
          ? { collectionId: command.collectionId }
          : {}),
      },
      include: {
        _count: { select: { nodes: true } },
        collection: { select: { id: true, name: true, slug: true } },
      },
    });

    return mapObjectSummary(object);
  }
}

@Injectable()
@CommandHandler(DeleteLocalizationObjectCommand)
export class DeleteLocalizationObjectHandler implements ICommandHandler<DeleteLocalizationObjectCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: DeleteLocalizationObjectCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const result = await this.prisma.localizationObject.deleteMany({
      where: { id: command.objectId, projectId: command.projectId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Localization object not found');
    }
    return { deleted: true };
  }
}

@Injectable()
@CommandHandler(CreateLocalizationNodeCommand)
export class CreateLocalizationNodeHandler implements ICommandHandler<CreateLocalizationNodeCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: CreateLocalizationNodeCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    await ensureObject(this.prisma, command.projectId, command.objectId);

    if (command.parentId) {
      const parent = await this.prisma.localizationNode.findFirst({
        where: { id: command.parentId, objectId: command.objectId },
      });
      if (!parent) {
        throw new NotFoundException('Parent node not found');
      }
    }

    await ensureSiblingSlugUnique(
      this.prisma,
      command.objectId,
      command.parentId,
      command.slug,
    );

    const node = await this.prisma.localizationNode.create({
      data: {
        objectId: command.objectId,
        parentId: command.parentId,
        sortOrder: command.sortOrder ?? 0,
        slug: command.slug,
        nodeType: command.nodeType as LocalizationNodeType,
        label: command.label,
        sourceText: command.sourceText,
        description: command.description,
        context: command.context,
        contentType: command.contentType,
      },
    });

    return mapNode(node);
  }
}

@Injectable()
@CommandHandler(UpdateLocalizationNodeCommand)
export class UpdateLocalizationNodeHandler implements ICommandHandler<UpdateLocalizationNodeCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: UpdateLocalizationNodeCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    await ensureObject(this.prisma, command.projectId, command.objectId);

    const existing = await this.prisma.localizationNode.findFirst({
      where: { id: command.nodeId, objectId: command.objectId },
    });
    if (!existing) {
      throw new NotFoundException('Localization node not found');
    }

    const node = await this.prisma.localizationNode.update({
      where: { id: command.nodeId },
      data: {
        ...(command.sortOrder !== undefined
          ? { sortOrder: command.sortOrder }
          : {}),
        ...(command.label !== undefined ? { label: command.label } : {}),
        ...(command.sourceText !== undefined
          ? { sourceText: command.sourceText }
          : {}),
        ...(command.description !== undefined
          ? { description: command.description }
          : {}),
        ...(command.context !== undefined ? { context: command.context } : {}),
        ...(command.contentType !== undefined
          ? { contentType: command.contentType }
          : {}),
        ...(command.nodeType !== undefined
          ? { nodeType: command.nodeType as LocalizationNodeType }
          : {}),
      },
    });

    return mapNode(node);
  }
}

@Injectable()
@CommandHandler(DeleteLocalizationNodeCommand)
export class DeleteLocalizationNodeHandler implements ICommandHandler<DeleteLocalizationNodeCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: DeleteLocalizationNodeCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    await ensureObject(this.prisma, command.projectId, command.objectId);

    const result = await this.prisma.localizationNode.deleteMany({
      where: { id: command.nodeId, objectId: command.objectId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Localization node not found');
    }
    return { deleted: true };
  }
}

@Injectable()
@CommandHandler(MaterializeLocalizationObjectCommand)
export class MaterializeLocalizationObjectHandler implements ICommandHandler<MaterializeLocalizationObjectCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly materialize: MaterializeObjectService,
  ) {}

  async execute(command: MaterializeLocalizationObjectCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    return this.materialize.materialize(command.projectId, command.objectId, {
      prune: command.prune,
    });
  }
}

@Injectable()
@CommandHandler(TranslateLocalizationObjectCommand)
export class TranslateLocalizationObjectHandler implements ICommandHandler<TranslateLocalizationObjectCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly objectBatch: ObjectBatchTranslationService,
  ) {}

  async execute(command: TranslateLocalizationObjectCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    return this.objectBatch.createBatchJob(
      command.tenantId,
      command.projectId,
      [command.objectId],
      command.languages,
      command.createdById,
    );
  }
}

@Injectable()
@CommandHandler(TranslateObjectsBatchCommand)
export class TranslateObjectsBatchHandler implements ICommandHandler<TranslateObjectsBatchCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly objectBatch: ObjectBatchTranslationService,
  ) {}

  async execute(command: TranslateObjectsBatchCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    return this.objectBatch.createBatchJob(
      command.tenantId,
      command.projectId,
      command.objectIds,
      command.languages,
      command.createdById,
    );
  }
}

@Injectable()
@CommandHandler(GenerateLocalizationObjectStructureCommand)
export class GenerateLocalizationObjectStructureHandler implements ICommandHandler<GenerateLocalizationObjectStructureCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly queue: LocalizationObjectQueueService,
  ) {}

  async execute(command: GenerateLocalizationObjectStructureCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const object = await ensureObject(
      this.prisma,
      command.projectId,
      command.objectId,
    );

    if (
      object.generationStatus === 'queued' ||
      object.generationStatus === 'generating'
    ) {
      throw new BadRequestException('Structure generation already in progress');
    }

    await this.prisma.localizationObject.update({
      where: { id: command.objectId },
      data: {
        generationStatus: 'queued',
        generationError: null,
      },
    });

    await this.queue.enqueueGenerate({
      projectId: command.projectId,
      objectId: command.objectId,
      tenantId: command.tenantId,
    });

    return { queued: true, generationStatus: 'queued' };
  }
}

@Injectable()
@CommandHandler(ApplyLocalizationObjectTemplateCommand)
export class ApplyLocalizationObjectTemplateHandler implements ICommandHandler<ApplyLocalizationObjectTemplateCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: ApplyLocalizationObjectTemplateCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    await ensureObject(this.prisma, command.projectId, command.objectId);

    const template = getObjectTemplate(command.templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await applyStructureTree(this.prisma, command.objectId, template.nodes);

    return {
      applied: true,
      templateId: template.id,
      templateName: template.name,
    };
  }
}

@Injectable()
@QueryHandler(ListLocalizationObjectsQuery)
export class ListLocalizationObjectsHandler implements IQueryHandler<ListLocalizationObjectsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: ListLocalizationObjectsQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const where = {
      projectId: query.projectId,
      ...(query.collectionId ? { collectionId: query.collectionId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                slug: { contains: query.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const [objects, total] = await Promise.all([
      this.prisma.localizationObject.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { nodes: true } },
          collection: { select: { id: true, name: true, slug: true } },
          nodes: {
            where: { translationKeyId: { not: null } },
            select: { id: true },
          },
        },
      }),
      this.prisma.localizationObject.count({ where }),
    ]);

    return {
      items: objects.map((object) =>
        mapObjectSummary(object, object.nodes.length),
      ),
      meta: { page: query.page, limit: query.limit, total },
    };
  }
}

@Injectable()
@QueryHandler(GetLocalizationObjectQuery)
export class GetLocalizationObjectHandler implements IQueryHandler<GetLocalizationObjectQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(query: GetLocalizationObjectQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const object = await this.prisma.localizationObject.findFirst({
      where: { id: query.objectId, projectId: query.projectId },
      include: {
        _count: { select: { nodes: true } },
        collection: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!object) {
      throw new NotFoundException('Localization object not found');
    }

    const nodes = await this.prisma.localizationNode.findMany({
      where: { objectId: query.objectId },
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    });

    const materializedCount = nodes.filter((n) => n.translationKeyId).length;

    return {
      ...mapObjectSummary(object, materializedCount),
      tree: buildTreeFromNodes(nodes).map((node) => mapTreeNode(node)),
    };
  }
}

type LocalizationNodeResponse = ReturnType<typeof mapNode> & {
  children: LocalizationNodeResponse[];
};

function mapTreeNode(node: LocalizationNodeTree): LocalizationNodeResponse {
  return {
    ...mapNode(node),
    children: node.children.map((child) => mapTreeNode(child)),
  };
}

@Injectable()
@QueryHandler(ListLocalizationObjectTemplatesQuery)
export class ListLocalizationObjectTemplatesHandler implements IQueryHandler<ListLocalizationObjectTemplatesQuery> {
  execute(query: ListLocalizationObjectTemplatesQuery) {
    void query;
    return Promise.resolve({ items: listObjectTemplates() });
  }
}
