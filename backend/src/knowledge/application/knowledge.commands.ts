import { KnowledgeSourceType } from '@prisma/client';

export class CreateKnowledgeSourceCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly sourceType: KnowledgeSourceType,
    public readonly content: string,
    public readonly originalFilename?: string,
  ) {}
}

export class DeleteKnowledgeSourceCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly sourceId: string,
  ) {}
}

export class ListKnowledgeSourcesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}
