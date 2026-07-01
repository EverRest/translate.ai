export class CreateTranslationKeyCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly key: string,
    public readonly sourceText: string,
    public readonly description?: string,
    public readonly context?: string,
    public readonly contentType?: string,
  ) {}
}

export class UpdateTranslationKeyCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly keyId: string,
    public readonly description?: string,
    public readonly context?: string,
    public readonly contentType?: string | null,
    public readonly sourceText?: string,
  ) {}
}

export class DeleteTranslationKeyCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly keyId: string,
  ) {}
}

export class ListTranslationKeysQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly localizationObjectId?: string,
    public readonly keyPrefix?: string,
    public readonly staleOnly?: boolean,
    public readonly scope?: string,
  ) {}
}
