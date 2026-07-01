import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { Public } from '../../shared/auth/decorators/public.decorator';
import { Roles } from '../../shared/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { successResponse } from '../../shared/presentation/api-response';
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
} from '../application/confluence.commands';
import { ConfluenceOAuthService } from '../application/confluence-oauth.service';
import {
  CompleteConfluenceConnectDto,
  ConfluenceOAuthCallbackDto,
  TriggerConfluenceSyncDto,
  UpdateConfluenceSyncConfigDto,
  UpsertTenantAtlassianOAuthDto,
} from './dto/confluence.dto';

@ApiTags('confluence-integration')
@Controller()
export class ConfluenceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly oauth: ConfluenceOAuthService,
  ) {}

  @Get('projects/:projectId/integrations/confluence')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'Get Confluence connection status' })
  async getIntegration(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetConfluenceIntegrationQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Get('projects/:projectId/integrations/confluence/connect')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'Get Atlassian OAuth authorize URL' })
  async connect(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetConfluenceConnectUrlQuery(user.tenantId, projectId, user.userId),
    );
    return successResponse(data);
  }

  @Get('projects/:projectId/integrations/confluence/connect/pending-sites')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'List Confluence sites from pending OAuth token' })
  async pendingSites(@Query('pendingToken') pendingToken: string) {
    const data = await this.queryBus.execute(
      new GetConfluencePendingSitesQuery(pendingToken),
    );
    return successResponse(data);
  }

  @Post('projects/:projectId/integrations/confluence/connect/complete')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'Complete OAuth after multi-site selection' })
  async completeConnect(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CompleteConfluenceConnectDto,
  ) {
    const data = await this.commandBus.execute(
      new CompleteConfluenceConnectCommand(
        user.tenantId,
        projectId,
        dto.pendingToken,
        dto.cloudId,
      ),
    );
    return successResponse(data);
  }

  @Public()
  @Get('integrations/confluence/oauth/callback')
  @ApiOperation({ summary: 'Atlassian OAuth callback (redirect)' })
  async oauthCallback(
    @Query() query: ConfluenceOAuthCallbackDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.oauth.handleCallback(query.code, query.state);
      if (result.type === 'pick_site') {
        const redirect = this.oauth.getFrontendRedirectUrl(
          result.projectId,
          'pick_site',
          result.pendingToken,
        );
        res.redirect(redirect);
        return;
      }
      const redirect = this.oauth.getFrontendRedirectUrl(
        result.projectId,
        'connected',
      );
      res.redirect(redirect);
    } catch {
      try {
        const state = this.oauth.verifyState(query.state);
        const redirect = this.oauth.getFrontendRedirectUrl(
          state.projectId,
          'error',
        );
        res.redirect(redirect);
      } catch {
        res.status(400).send('OAuth callback failed');
      }
    }
  }

  @Put('projects/:projectId/integrations/confluence/config')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'Update Confluence sync config' })
  async updateConfig(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateConfluenceSyncConfigDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateConfluenceSyncConfigCommand(
        user.tenantId,
        projectId,
        dto.pageIds,
        dto.spaceKey,
        dto.autoApply,
        dto.labelFilter,
        dto.parseRulesJson as Record<string, unknown> | undefined,
        dto.syncEnabled,
        dto.syncIntervalMinutes,
      ),
    );
    return successResponse(data);
  }

  @Get('projects/:projectId/integrations/confluence/spaces')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'List Confluence spaces' })
  async listSpaces(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new ListConfluenceSpacesQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Get('projects/:projectId/integrations/confluence/spaces/:spaceId/pages')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'List pages in a Confluence space' })
  async listPages(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('spaceId') spaceId: string,
    @Query('label') label?: string,
  ) {
    const data = await this.queryBus.execute(
      new ListConfluencePagesQuery(user.tenantId, projectId, spaceId, label),
    );
    return successResponse(data);
  }

  @Post('projects/:projectId/integrations/confluence/sync')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'Trigger Confluence live sync' })
  async sync(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: TriggerConfluenceSyncDto,
  ) {
    const data = await this.commandBus.execute(
      new TriggerConfluenceSyncCommand(
        user.tenantId,
        projectId,
        user.userId,
        dto.autoApply,
      ),
    );
    return successResponse(data);
  }

  @Delete('projects/:projectId/integrations/confluence')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'Disconnect Confluence' })
  async disconnect(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.commandBus.execute(
      new DisconnectConfluenceCommand(user.tenantId, projectId),
    );
    return successResponse(data);
  }
}

@ApiTags('tenant-atlassian-oauth')
@Controller('tenant/integrations/atlassian')
@Roles(UserRole.admin)
@ApiBearerAuth()
export class TenantAtlassianOAuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get tenant BYO Atlassian OAuth app (admin)' })
  async get(@CurrentUser() user: AuthUser) {
    const data = await this.queryBus.execute(
      new GetTenantAtlassianOAuthQuery(user.tenantId),
    );
    return successResponse(data);
  }

  @Put()
  @ApiOperation({ summary: 'Upsert tenant BYO Atlassian OAuth app (admin)' })
  async upsert(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertTenantAtlassianOAuthDto,
  ) {
    const data = await this.commandBus.execute(
      new UpsertTenantAtlassianOAuthCommand(
        user.tenantId,
        dto.clientId,
        dto.clientSecret,
        dto.redirectUri,
        dto.scopes,
      ),
    );
    return successResponse(data);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove tenant BYO Atlassian OAuth app (admin)' })
  async remove(@CurrentUser() user: AuthUser) {
    const data = await this.commandBus.execute(
      new DeleteTenantAtlassianOAuthCommand(user.tenantId),
    );
    return successResponse(data);
  }
}
