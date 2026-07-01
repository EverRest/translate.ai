export class GetConfluenceConnectUrlQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly userId: string,
  ) {}
}

export class GetConfluenceIntegrationQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class UpdateConfluenceSyncConfigCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly pageIds: string[],
    public readonly spaceKey?: string,
    public readonly autoApply?: boolean,
  ) {}
}

export class ListConfluenceSpacesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class ListConfluencePagesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly spaceId: string,
  ) {}
}

export class TriggerConfluenceSyncCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly userId: string,
    public readonly autoApply?: boolean,
  ) {}
}

export class DisconnectConfluenceCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}
