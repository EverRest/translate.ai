export class ListProjectsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}

export class GetProjectQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class ListApiKeysQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class ListProjectLanguagesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class ListWebhooksQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}
