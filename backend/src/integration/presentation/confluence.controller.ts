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
import { successResponse } from '../../shared/presentation/api-response';
import {
  DisconnectConfluenceCommand,
  GetConfluenceConnectUrlQuery,
  GetConfluenceIntegrationQuery,
  ListConfluencePagesQuery,
  ListConfluenceSpacesQuery,
  TriggerConfluenceSyncCommand,
  UpdateConfluenceSyncConfigCommand,
} from '../application/confluence.commands';
import { ConfluenceOAuthService } from '../application/confluence-oauth.service';
import {
  ConfluenceOAuthCallbackDto,
  TriggerConfluenceSyncDto,
  UpdateConfluenceSyncConfigDto,
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

  @Public()
  @Get('integrations/confluence/oauth/callback')
  @ApiOperation({ summary: 'Atlassian OAuth callback (redirect)' })
  async oauthCallback(
    @Query() query: ConfluenceOAuthCallbackDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.oauth.handleCallback(query.code, query.state);
      const redirect = this.oauth.getFrontendRedirectUrl(
        result.projectId,
        true,
      );
      res.redirect(redirect);
    } catch {
      const state = this.oauth.verifyState(query.state);
      const redirect = this.oauth.getFrontendRedirectUrl(
        state.projectId,
        false,
      );
      res.redirect(redirect);
    }
  }

  @Put('projects/:projectId/integrations/confluence/config')
  @ApiBearerAuth()
  @AllowApiKey()
  @ApiOperation({ summary: 'Update Confluence sync config (page IDs)' })
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
  ) {
    const data = await this.queryBus.execute(
      new ListConfluencePagesQuery(user.tenantId, projectId, spaceId),
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
