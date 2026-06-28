import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KnowledgeSourceStatus } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { KnowledgeQueueService } from '../../infrastructure/knowledge-queue.service';
import {
  CreateKnowledgeSourceCommand,
  DeleteKnowledgeSourceCommand,
  ListKnowledgeSourcesQuery,
} from '../knowledge.commands';

function mapSource(source: {
  id: string;
  name: string;
  sourceType: string;
  status: string;
  originalFilename: string | null;
  byteSize: number;
  chunkCount: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: source.id,
    name: source.name,
    sourceType: source.sourceType,
    status: source.status,
    originalFilename: source.originalFilename,
    byteSize: source.byteSize,
    chunkCount: source.chunkCount,
    errorMessage: source.errorMessage,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

@Injectable()
@CommandHandler(CreateKnowledgeSourceCommand)
export class CreateKnowledgeSourceHandler implements ICommandHandler<CreateKnowledgeSourceCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly prisma: PrismaService,
    private readonly knowledgeQueue: KnowledgeQueueService,
  ) {}

  async execute(command: CreateKnowledgeSourceCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const content = command.content.trim();
    if (!content) {
      throw new BadRequestException('Knowledge content is required');
    }

    const source = await this.prisma.projectKnowledgeSource.create({
      data: {
        projectId: command.projectId,
        name: command.name.trim(),
        sourceType: command.sourceType,
        status: KnowledgeSourceStatus.pending,
        rawContent: content,
        originalFilename: command.originalFilename ?? null,
        byteSize: Buffer.byteLength(content, 'utf8'),
      },
    });

    await this.knowledgeQueue.enqueueIngest({
      tenantId: command.tenantId,
      projectId: command.projectId,
      sourceId: source.id,
    });

    return { source: mapSource(source), queued: true };
  }
}

@Injectable()
@CommandHandler(DeleteKnowledgeSourceCommand)
export class DeleteKnowledgeSourceHandler implements ICommandHandler<DeleteKnowledgeSourceCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: DeleteKnowledgeSourceCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const result = await this.prisma.projectKnowledgeSource.deleteMany({
      where: {
        id: command.sourceId,
        projectId: command.projectId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Knowledge source not found');
    }

    return { deleted: true };
  }
}

@Injectable()
@QueryHandler(ListKnowledgeSourcesQuery)
export class ListKnowledgeSourcesHandler implements IQueryHandler<ListKnowledgeSourcesQuery> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: ListKnowledgeSourcesQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const items = await this.prisma.projectKnowledgeSource.findMany({
      where: { projectId: query.projectId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return { items: items.map(mapSource) };
  }
}
