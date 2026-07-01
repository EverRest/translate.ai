export class GetStaleTranslationSummaryQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class GetStaleTranslationKeyHintsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}
