export class CreateLocalizationObjectCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly slug: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly templateType?: string,
    public readonly collectionId?: string,
  ) {}
}

export class UpdateLocalizationObjectCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
    public readonly name?: string,
    public readonly description?: string | null,
    public readonly templateType?: string,
    public readonly collectionId?: string | null,
  ) {}
}

export class DeleteLocalizationObjectCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
  ) {}
}

export class CreateLocalizationNodeCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
    public readonly slug: string,
    public readonly nodeType: string,
    public readonly parentId?: string,
    public readonly sortOrder?: number,
    public readonly label?: string,
    public readonly sourceText?: string,
    public readonly description?: string,
    public readonly context?: string,
    public readonly contentType?: string,
  ) {}
}

export class UpdateLocalizationNodeCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
    public readonly nodeId: string,
    public readonly sortOrder?: number,
    public readonly label?: string | null,
    public readonly sourceText?: string | null,
    public readonly description?: string | null,
    public readonly context?: string | null,
    public readonly contentType?: string | null,
    public readonly nodeType?: string,
  ) {}
}

export class DeleteLocalizationNodeCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
    public readonly nodeId: string,
  ) {}
}

export class MaterializeLocalizationObjectCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
    public readonly prune = false,
  ) {}
}

export class TranslateLocalizationObjectCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
    public readonly languages: string[],
    public readonly createdById?: string,
  ) {}
}

export class TranslateObjectsBatchCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectIds: string[],
    public readonly languages: string[],
    public readonly createdById?: string,
  ) {}
}

export class GenerateLocalizationObjectStructureCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
  ) {}
}

export class ApplyLocalizationObjectTemplateCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
    public readonly templateId: string,
  ) {}
}

export class ListLocalizationObjectsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly collectionId?: string,
  ) {}
}

export class GetLocalizationObjectQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly objectId: string,
  ) {}
}

export class ListLocalizationObjectTemplatesQuery {
  constructor(public readonly tenantId: string) {}
}
