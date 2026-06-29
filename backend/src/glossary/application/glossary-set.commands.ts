export class ListGlossariesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class CreateGlossaryCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly cloneFromActive: boolean,
  ) {}
}

export class ActivateGlossaryCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly glossaryId: string,
  ) {}
}
