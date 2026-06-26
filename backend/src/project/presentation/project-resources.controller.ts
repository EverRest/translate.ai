import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import {
  AddProjectLanguageCommand,
  CreateApiKeyCommand,
  CreateWebhookCommand,
  DeleteWebhookCommand,
  RemoveProjectLanguageCommand,
  RevokeApiKeyCommand,
  UpdateWebhookCommand,
} from '../application/commands/project.commands';
import {
  ListApiKeysQuery,
  ListProjectLanguagesQuery,
  ListWebhooksQuery,
} from '../application/queries/project.queries';
import {
  AddProjectLanguageDto,
  CreateApiKeyDto,
  CreateWebhookDto,
  UpdateWebhookDto,
} from './dto/project-resources.dto';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects/:projectId')
export class ProjectResourcesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('api-keys')
  @ApiOperation({ summary: 'List project API keys' })
  async listApiKeys(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new ListApiKeysQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Create project API key' })
  async createApiKey(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateApiKeyCommand(user.tenantId, projectId, dto.name),
    );
    return successResponse(data);
  }

  @Delete('api-keys/:apiKeyId')
  @ApiOperation({ summary: 'Revoke project API key' })
  async revokeApiKey(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('apiKeyId') apiKeyId: string,
  ) {
    const data = await this.commandBus.execute(
      new RevokeApiKeyCommand(user.tenantId, projectId, apiKeyId),
    );
    return successResponse(data);
  }

  @Get('languages')
  @ApiOperation({ summary: 'List project target languages' })
  async listLanguages(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new ListProjectLanguagesQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Post('languages')
  @ApiOperation({ summary: 'Add target language to project' })
  async addLanguage(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectLanguageDto,
  ) {
    const data = await this.commandBus.execute(
      new AddProjectLanguageCommand(user.tenantId, projectId, dto.code),
    );
    return successResponse(data);
  }

  @Delete('languages/:languageId')
  @ApiOperation({ summary: 'Remove target language from project' })
  async removeLanguage(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('languageId') languageId: string,
  ) {
    const data = await this.commandBus.execute(
      new RemoveProjectLanguageCommand(user.tenantId, projectId, languageId),
    );
    return successResponse(data);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List project webhooks' })
  async listWebhooks(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new ListWebhooksQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create project webhook' })
  async createWebhook(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateWebhookCommand(
        user.tenantId,
        projectId,
        dto.url,
        dto.secret,
        dto.enabled ?? true,
      ),
    );
    return successResponse(data);
  }

  @Patch('webhooks/:webhookId')
  @ApiOperation({ summary: 'Update project webhook' })
  async updateWebhook(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('webhookId') webhookId: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateWebhookCommand(
        user.tenantId,
        projectId,
        webhookId,
        dto.url,
        dto.enabled,
      ),
    );
    return successResponse(data);
  }

  @Delete('webhooks/:webhookId')
  @ApiOperation({ summary: 'Delete project webhook' })
  async deleteWebhook(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('webhookId') webhookId: string,
  ) {
    const data = await this.commandBus.execute(
      new DeleteWebhookCommand(user.tenantId, projectId, webhookId),
    );
    return successResponse(data);
  }
}
