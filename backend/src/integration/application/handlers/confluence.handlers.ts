import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler,
  QueryHandler,
  IQueryHandler,
} from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ConfluenceFetchService } from '../confluence-fetch.service';
import { ConfluenceOAuthService } from '../confluence-oauth.service';
import { ConfluenceSyncTriggerService } from '../confluence-sync-trigger.service';
import { TenantAtlassianOAuthService } from '../tenant-atlassian-oauth.service';
import {
  CompleteConfluenceConnectCommand,
  DeleteTenantAtlassianOAuthCommand,
  DisconnectConfluenceCommand,
  GetConfluenceConnectUrlQuery,
  GetConfluenceIntegrationQuery,
  GetConfluencePendingSitesQuery,
  GetTenantAtlassianOAuthQuery,
  ListConfluencePagesQuery,
  ListConfluenceSpacesQuery,
  TriggerConfluenceSyncCommand,
  UpdateConfluenceSyncConfigCommand,
  UpsertTenantAtlassianOAuthCommand,
} from '../confluence.commands';

async function withOAuthMeta(
  oauth: ConfluenceOAuthService,
  tenantId: string,
  data: Record<string, unknown>,
) {
  const oauthAvailable = await oauth.isOAuthConfigured(tenantId);
  return {
    ...data,
    oauthAvailable,
    setupHint: oauthAvailable ? null : await oauth.getSetupHint(tenantId),
  };
}

function toIntegrationDto(
  connection: {
    id: string;
    siteUrl: string;
    siteName: string | null;
    cloudId: string;
    tokenExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  syncConfig: {
    pageIds: string[];
    spaceKey: string | null;
    labelFilter: string | null;
    parseRulesJson: unknown;
    autoApply: boolean;
    syncEnabled: boolean;
    syncIntervalMinutes: number | null;
    nextSyncAt: Date | null;
    lastSyncedAt: Date | null;
    lastSyncStatus: string | null;
    lastSyncSummaryJson: unknown;
    lastImportSessionId: string | null;
    lastErrorMessage: string | null;
  } | null,
) {
  return {
    connected: true,
    connection: {
      id: connection.id,
      siteUrl: connection.siteUrl,
      siteName: connection.siteName,
      cloudId: connection.cloudId,
      tokenExpiresAt: connection.tokenExpiresAt,
      connectedAt: connection.createdAt,
    },
    syncConfig: syncConfig
      ? {
          pageIds: syncConfig.pageIds,
          spaceKey: syncConfig.spaceKey,
          labelFilter: syncConfig.labelFilter,
          parseRulesJson: syncConfig.parseRulesJson,
          autoApply: syncConfig.autoApply,
          syncEnabled: syncConfig.syncEnabled,
          syncIntervalMinutes: syncConfig.syncIntervalMinutes,
          nextSyncAt: syncConfig.nextSyncAt,
          lastSyncedAt: syncConfig.lastSyncedAt,
          lastSyncStatus: syncConfig.lastSyncStatus,
          lastSyncSummary: syncConfig.lastSyncSummaryJson,
          lastImportSessionId: syncConfig.lastImportSessionId,
          lastErrorMessage: syncConfig.lastErrorMessage,
        }
      : null,
  };
}

@Injectable()
@QueryHandler(GetConfluenceConnectUrlQuery)
export class GetConfluenceConnectUrlHandler implements IQueryHandler<GetConfluenceConnectUrlQuery> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly oauth: ConfluenceOAuthService,
  ) {}

  async execute(query: GetConfluenceConnectUrlQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    const url = await this.oauth.createAuthorizeUrl({
      tenantId: query.tenantId,
      projectId: query.projectId,
      userId: query.userId,
    });
    return { url };
  }
}

@Injectable()
@QueryHandler(GetConfluencePendingSitesQuery)
export class GetConfluencePendingSitesHandler implements IQueryHandler<GetConfluencePendingSitesQuery> {
  constructor(private readonly oauth: ConfluenceOAuthService) {}

  execute(query: GetConfluencePendingSitesQuery) {
    return Promise.resolve({
      sites: this.oauth.getPendingSites(query.pendingToken),
    });
  }
}

@Injectable()
@CommandHandler(CompleteConfluenceConnectCommand)
export class CompleteConfluenceConnectHandler implements ICommandHandler<CompleteConfluenceConnectCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly oauth: ConfluenceOAuthService,
  ) {}

  async execute(command: CompleteConfluenceConnectCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    const result = await this.oauth.completePendingConnection(
      command.pendingToken,
      command.cloudId,
    );
    return result;
  }
}

@Injectable()
@QueryHandler(GetConfluenceIntegrationQuery)
export class GetConfluenceIntegrationHandler implements IQueryHandler<GetConfluenceIntegrationQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly oauth: ConfluenceOAuthService,
  ) {}

  async execute(query: GetConfluenceIntegrationQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );

    const connection = await this.prisma.confluenceConnection.findUnique({
      where: { projectId: query.projectId },
      include: { syncConfig: true },
    });

    if (!connection) {
      return withOAuthMeta(this.oauth, query.tenantId, { connected: false });
    }

    return withOAuthMeta(
      this.oauth,
      query.tenantId,
      toIntegrationDto(connection, connection.syncConfig),
    );
  }
}

@Injectable()
@CommandHandler(UpdateConfluenceSyncConfigCommand)
export class UpdateConfluenceSyncConfigHandler implements ICommandHandler<UpdateConfluenceSyncConfigCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: UpdateConfluenceSyncConfigCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const connection = await this.prisma.confluenceConnection.findUnique({
      where: { projectId: command.projectId },
    });
    if (!connection) {
      throw new NotFoundException(
        'Confluence is not connected for this project',
      );
    }

    const nextSyncAt =
      command.syncEnabled && command.syncIntervalMinutes
        ? new Date(Date.now() + command.syncIntervalMinutes * 60_000)
        : command.syncEnabled === false
          ? null
          : undefined;

    const syncConfig = await this.prisma.confluenceSyncConfig.upsert({
      where: { connectionId: connection.id },
      create: {
        connectionId: connection.id,
        pageIds: command.pageIds,
        spaceKey: command.spaceKey,
        autoApply: command.autoApply ?? false,
        labelFilter: command.labelFilter ?? null,
        parseRulesJson: (command.parseRulesJson ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        syncEnabled: command.syncEnabled ?? false,
        syncIntervalMinutes: command.syncIntervalMinutes ?? null,
        nextSyncAt: nextSyncAt ?? null,
      },
      update: {
        pageIds: command.pageIds,
        spaceKey: command.spaceKey,
        ...(command.autoApply !== undefined
          ? { autoApply: command.autoApply }
          : {}),
        ...(command.labelFilter !== undefined
          ? { labelFilter: command.labelFilter }
          : {}),
        ...(command.parseRulesJson !== undefined
          ? {
              parseRulesJson: command.parseRulesJson as Prisma.InputJsonValue,
            }
          : {}),
        ...(command.syncEnabled !== undefined
          ? { syncEnabled: command.syncEnabled }
          : {}),
        ...(command.syncIntervalMinutes !== undefined
          ? { syncIntervalMinutes: command.syncIntervalMinutes }
          : {}),
        ...(nextSyncAt !== undefined ? { nextSyncAt } : {}),
      },
    });

    return {
      pageIds: syncConfig.pageIds,
      autoApply: syncConfig.autoApply,
      labelFilter: syncConfig.labelFilter,
      syncEnabled: syncConfig.syncEnabled,
      syncIntervalMinutes: syncConfig.syncIntervalMinutes,
    };
  }
}

@Injectable()
@QueryHandler(ListConfluenceSpacesQuery)
export class ListConfluenceSpacesHandler implements IQueryHandler<ListConfluenceSpacesQuery> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly prisma: PrismaService,
    private readonly fetch: ConfluenceFetchService,
  ) {}

  async execute(query: ListConfluenceSpacesQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    const connection = await this.prisma.confluenceConnection.findUnique({
      where: { projectId: query.projectId },
    });
    if (!connection) {
      throw new NotFoundException('Confluence is not connected');
    }
    const spaces = await this.fetch.listSpaces(connection.id);
    return { items: spaces };
  }
}

@Injectable()
@QueryHandler(ListConfluencePagesQuery)
export class ListConfluencePagesHandler implements IQueryHandler<ListConfluencePagesQuery> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly prisma: PrismaService,
    private readonly fetch: ConfluenceFetchService,
  ) {}

  async execute(query: ListConfluencePagesQuery) {
    await this.projectAccess.getProjectForTenant(
      query.tenantId,
      query.projectId,
    );
    const connection = await this.prisma.confluenceConnection.findUnique({
      where: { projectId: query.projectId },
      include: { syncConfig: true },
    });
    if (!connection) {
      throw new NotFoundException('Confluence is not connected');
    }
    const labelFilter =
      query.labelFilter ?? connection.syncConfig?.labelFilter ?? undefined;
    const pages = await this.fetch.listPages(
      connection.id,
      query.spaceId,
      labelFilter ?? undefined,
    );
    return { items: pages };
  }
}

@Injectable()
@CommandHandler(TriggerConfluenceSyncCommand)
export class TriggerConfluenceSyncHandler implements ICommandHandler<TriggerConfluenceSyncCommand> {
  constructor(
    private readonly projectAccess: ProjectAccessService,
    private readonly trigger: ConfluenceSyncTriggerService,
  ) {}

  async execute(command: TriggerConfluenceSyncCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );
    return this.trigger.triggerForProject(
      command.tenantId,
      command.projectId,
      command.userId,
      command.autoApply,
    );
  }
}

@Injectable()
@CommandHandler(DisconnectConfluenceCommand)
export class DisconnectConfluenceHandler implements ICommandHandler<DisconnectConfluenceCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async execute(command: DisconnectConfluenceCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    await this.prisma.confluenceConnection.deleteMany({
      where: { projectId: command.projectId, tenantId: command.tenantId },
    });

    return { disconnected: true };
  }
}

@Injectable()
@QueryHandler(GetTenantAtlassianOAuthQuery)
export class GetTenantAtlassianOAuthHandler implements IQueryHandler<GetTenantAtlassianOAuthQuery> {
  constructor(private readonly service: TenantAtlassianOAuthService) {}

  execute(query: GetTenantAtlassianOAuthQuery) {
    return this.service.get(query);
  }
}

@Injectable()
@CommandHandler(UpsertTenantAtlassianOAuthCommand)
export class UpsertTenantAtlassianOAuthHandler implements ICommandHandler<UpsertTenantAtlassianOAuthCommand> {
  constructor(private readonly service: TenantAtlassianOAuthService) {}

  execute(command: UpsertTenantAtlassianOAuthCommand) {
    return this.service.upsert(command);
  }
}

@Injectable()
@CommandHandler(DeleteTenantAtlassianOAuthCommand)
export class DeleteTenantAtlassianOAuthHandler implements ICommandHandler<DeleteTenantAtlassianOAuthCommand> {
  constructor(private readonly service: TenantAtlassianOAuthService) {}

  execute(command: DeleteTenantAtlassianOAuthCommand) {
    return this.service.delete(command);
  }
}
