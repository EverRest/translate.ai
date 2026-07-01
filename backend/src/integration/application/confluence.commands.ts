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

export class GetConfluencePendingSitesQuery {
  constructor(public readonly pendingToken: string) {}
}

export class CompleteConfluenceConnectCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly pendingToken: string,
    public readonly cloudId: string,
  ) {}
}

export class UpdateConfluenceSyncConfigCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly pageIds: string[],
    public readonly spaceKey?: string,
    public readonly autoApply?: boolean,
    public readonly labelFilter?: string | null,
    public readonly parseRulesJson?: Record<string, unknown> | null,
    public readonly syncEnabled?: boolean,
    public readonly syncIntervalMinutes?: number | null,
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
    public readonly labelFilter?: string,
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

export class GetTenantAtlassianOAuthQuery {
  constructor(public readonly tenantId: string) {}
}

export class UpsertTenantAtlassianOAuthCommand {
  constructor(
    public readonly tenantId: string,
    public readonly clientId: string,
    public readonly clientSecret: string,
    public readonly redirectUri?: string,
    public readonly scopes?: string,
  ) {}
}

export class DeleteTenantAtlassianOAuthCommand {
  constructor(public readonly tenantId: string) {}
}
