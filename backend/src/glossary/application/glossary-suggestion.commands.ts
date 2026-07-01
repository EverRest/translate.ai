export class AnalyzeGlossaryCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class ApproveGlossarySuggestionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly suggestionId: string,
  ) {}
}

export class RejectGlossarySuggestionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly suggestionId: string,
  ) {}
}

export class ListGlossarySuggestionsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly status?: 'pending' | 'approved' | 'rejected',
  ) {}
}
