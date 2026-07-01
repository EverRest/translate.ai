export class GetCoverageMatrixQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly scopes?: string[],
    public readonly languages?: string[],
  ) {}
}
