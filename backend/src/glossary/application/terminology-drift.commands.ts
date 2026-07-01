export class ScanTerminologyDriftCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class ResolveTerminologyDriftIssueCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly issueId: string,
    public readonly canonicalTranslation: string,
  ) {}
}

export class ListTerminologyDriftIssuesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly status: 'open' | 'resolved' | 'all' = 'open',
  ) {}
}

export class CountTerminologyDriftIssuesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class GetTerminologyDriftKeyHintsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}
