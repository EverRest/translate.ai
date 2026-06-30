export class CreateEntityCollectionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly slug: string,
    public readonly name: string,
    public readonly description?: string,
  ) {}
}

export class UpdateEntityCollectionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly collectionId: string,
    public readonly name?: string,
    public readonly description?: string | null,
  ) {}
}

export class DeleteEntityCollectionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly collectionId: string,
  ) {}
}

export class ListEntityCollectionsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class PreviewOpenApiImportQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly collectionId: string,
    public readonly spec: string,
    public readonly selectedTags?: string[],
  ) {}
}

export class ImportOpenApiCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly collectionId: string,
    public readonly spec: string,
    public readonly selectedTags?: string[],
    public readonly materialize = false,
  ) {}
}
