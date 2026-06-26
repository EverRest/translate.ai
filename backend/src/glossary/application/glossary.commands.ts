export class CreateGlossaryTermCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly sourceTerm: string,
    public readonly targetTerm: string | undefined,
    public readonly doNotTranslate: boolean,
    public readonly note: string | undefined,
  ) {}
}

export class UpdateGlossaryTermCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly termId: string,
    public readonly sourceTerm: string | undefined,
    public readonly targetTerm: string | undefined,
    public readonly doNotTranslate: boolean | undefined,
    public readonly note: string | undefined,
  ) {}
}

export class DeleteGlossaryTermCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly termId: string,
  ) {}
}

export class ListGlossaryTermsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
  ) {}
}
