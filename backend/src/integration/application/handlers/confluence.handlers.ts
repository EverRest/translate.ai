import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler,
  QueryHandler,
  IQueryHandler,
} from '@nestjs/cqrs';
import { ImportSessionStatus } from '@prisma/client';
import { ProjectAccessService } from '../../../project/infrastructure/project-access.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ConfluenceFetchService } from '../confluence-fetch.service';
import { ConfluenceOAuthService } from '../confluence-oauth.service';
import { ConfluenceSyncQueueService } from '../../infrastructure/confluence-sync-queue.service';
import type { ParseRules } from '../../domain/import-document.types';
import {
  DisconnectConfluenceCommand,
  GetConfluenceConnectUrlQuery,
  GetConfluenceIntegrationQuery,
  ListConfluencePagesQuery,
  ListConfluenceSpacesQuery,
  TriggerConfluenceSyncCommand,
  UpdateConfluenceSyncConfigCommand,
} from '../confluence.commands';

function withOAuthMeta(
  oauth: ConfluenceOAuthService,
  data: Record<string, unknown>,
) {
  const oauthAvailable = oauth.isOAuthConfigured();
  return {
    ...data,
    oauthAvailable,
    setupHint: oauthAvailable ? null : oauth.getSetupHint(),
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
    autoApply: boolean;
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
          autoApply: syncConfig.autoApply,
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
    const url = this.oauth.createAuthorizeUrl({
      tenantId: query.tenantId,
      projectId: query.projectId,
      userId: query.userId,
    });
    return { url };
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
      return withOAuthMeta(this.oauth, { connected: false });
    }

    return withOAuthMeta(
      this.oauth,
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

    const syncConfig = await this.prisma.confluenceSyncConfig.upsert({
      where: { connectionId: connection.id },
      create: {
        connectionId: connection.id,
        pageIds: command.pageIds,
        spaceKey: command.spaceKey,
        autoApply: command.autoApply ?? false,
      },
      update: {
        pageIds: command.pageIds,
        spaceKey: command.spaceKey,
        ...(command.autoApply !== undefined
          ? { autoApply: command.autoApply }
          : {}),
      },
    });

    return { pageIds: syncConfig.pageIds, autoApply: syncConfig.autoApply };
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
    });
    if (!connection) {
      throw new NotFoundException('Confluence is not connected');
    }
    const pages = await this.fetch.listPages(connection.id, query.spaceId);
    return { items: pages };
  }
}

@Injectable()
@CommandHandler(TriggerConfluenceSyncCommand)
export class TriggerConfluenceSyncHandler implements ICommandHandler<TriggerConfluenceSyncCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly syncQueue: ConfluenceSyncQueueService,
  ) {}

  async execute(command: TriggerConfluenceSyncCommand) {
    await this.projectAccess.getProjectForTenant(
      command.tenantId,
      command.projectId,
    );

    const connection = await this.prisma.confluenceConnection.findUnique({
      where: { projectId: command.projectId },
      include: { syncConfig: true },
    });
    if (!connection?.syncConfig) {
      throw new NotFoundException('Confluence is not connected');
    }

    const pageIds = connection.syncConfig.pageIds;
    if (pageIds.length === 0) {
      throw new BadRequestException(
        'Select at least one Confluence page to sync',
      );
    }

    const autoApply =
      command.autoApply ?? connection.syncConfig.autoApply ?? false;

    const session = await this.prisma.importSession.create({
      data: {
        tenantId: command.tenantId,
        projectId: command.projectId,
        userId: command.userId,
        sourceType: 'confluence_live',
        status: ImportSessionStatus.pending,
        parseRulesJson: connection.syncConfig.parseRulesJson ?? undefined,
        originalFilename: 'confluence-live-sync',
      },
    });

    await this.syncQueue.enqueue({
      tenantId: command.tenantId,
      projectId: command.projectId,
      sessionId: session.id,
      connectionId: connection.id,
      pageIds,
      parseRules: (connection.syncConfig.parseRulesJson ?? undefined) as
        | ParseRules
        | undefined,
      autoApply,
      userId: command.userId,
    });

    return {
      queued: true,
      sessionId: session.id,
      autoApply,
    };
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
