import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import {
  paginatedResponse,
  successResponse,
} from '../../shared/presentation/api-response';
import { parsePagination } from '../../shared/utils/string.utils';
import {
  CreateLocalizationNodeCommand,
  CreateLocalizationObjectCommand,
  DeleteLocalizationNodeCommand,
  DeleteLocalizationObjectCommand,
  GenerateLocalizationObjectStructureCommand,
  ApplyLocalizationObjectTemplateCommand,
  GetLocalizationObjectQuery,
  ListLocalizationObjectTemplatesQuery,
  ListLocalizationObjectsQuery,
  MaterializeLocalizationObjectCommand,
  TranslateLocalizationObjectCommand,
  UpdateLocalizationNodeCommand,
  UpdateLocalizationObjectCommand,
} from '../application/localization-object.commands';
import {
  CreateLocalizationNodeDto,
  CreateLocalizationObjectDto,
  TranslateLocalizationObjectDto,
  ApplyLocalizationObjectTemplateDto,
  UpdateLocalizationNodeDto,
  UpdateLocalizationObjectDto,
} from './dto/localization-object.dto';

@ApiTags('localization-objects')
@ApiBearerAuth()
@AllowApiKey()
@Controller('projects/:projectId/objects')
export class LocalizationObjectsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List localization objects' })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: { page?: string; limit?: string; search?: string },
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new ListLocalizationObjectsQuery(
        user.tenantId,
        projectId,
        page,
        limit,
        query.search,
      ),
    );
    return paginatedResponse(data.items, page, limit, data.meta.total);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List built-in localization object templates' })
  async listTemplates(@CurrentUser() user: AuthUser) {
    const data = await this.queryBus.execute(
      new ListLocalizationObjectTemplatesQuery(user.tenantId),
    );
    return successResponse(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create localization object' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateLocalizationObjectDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateLocalizationObjectCommand(
        user.tenantId,
        projectId,
        dto.slug,
        dto.name,
        dto.description,
        dto.templateType,
      ),
    );
    return successResponse(data);
  }

  @Get(':objectId')
  @ApiOperation({ summary: 'Get localization object with tree' })
  async get(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetLocalizationObjectQuery(user.tenantId, projectId, objectId),
    );
    return successResponse(data);
  }

  @Patch(':objectId')
  @ApiOperation({ summary: 'Update localization object metadata' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
    @Body() dto: UpdateLocalizationObjectDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateLocalizationObjectCommand(
        user.tenantId,
        projectId,
        objectId,
        dto.name,
        dto.description,
        dto.templateType,
      ),
    );
    return successResponse(data);
  }

  @Delete(':objectId')
  @ApiOperation({ summary: 'Delete localization object' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
  ) {
    const data = await this.commandBus.execute(
      new DeleteLocalizationObjectCommand(user.tenantId, projectId, objectId),
    );
    return successResponse(data);
  }

  @Post(':objectId/nodes')
  @ApiOperation({ summary: 'Create localization node' })
  async createNode(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
    @Body() dto: CreateLocalizationNodeDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateLocalizationNodeCommand(
        user.tenantId,
        projectId,
        objectId,
        dto.slug,
        dto.nodeType,
        dto.parentId,
        dto.sortOrder,
        dto.label,
        dto.sourceText,
        dto.description,
        dto.context,
        dto.contentType,
      ),
    );
    return successResponse(data);
  }

  @Patch(':objectId/nodes/:nodeId')
  @ApiOperation({ summary: 'Update localization node' })
  async updateNode(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: UpdateLocalizationNodeDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateLocalizationNodeCommand(
        user.tenantId,
        projectId,
        objectId,
        nodeId,
        dto.sortOrder,
        dto.label,
        dto.sourceText,
        dto.description,
        dto.context,
        dto.contentType,
        dto.nodeType,
      ),
    );
    return successResponse(data);
  }

  @Delete(':objectId/nodes/:nodeId')
  @ApiOperation({ summary: 'Delete localization node' })
  async removeNode(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
    @Param('nodeId') nodeId: string,
  ) {
    const data = await this.commandBus.execute(
      new DeleteLocalizationNodeCommand(
        user.tenantId,
        projectId,
        objectId,
        nodeId,
      ),
    );
    return successResponse(data);
  }

  @Post(':objectId/materialize')
  @ApiOperation({ summary: 'Materialize object tree to translation keys' })
  async materialize(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
  ) {
    const data = await this.commandBus.execute(
      new MaterializeLocalizationObjectCommand(
        user.tenantId,
        projectId,
        objectId,
      ),
    );
    return successResponse(data);
  }

  @Post(':objectId/translate')
  @ApiOperation({
    summary: 'Materialize and create translation job for object',
  })
  async translate(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
    @Body() dto: TranslateLocalizationObjectDto,
  ) {
    const data = await this.commandBus.execute(
      new TranslateLocalizationObjectCommand(
        user.tenantId,
        projectId,
        objectId,
        dto.languages,
        user.userId,
      ),
    );
    return successResponse(data);
  }

  @Post(':objectId/generate-structure')
  @ApiOperation({ summary: 'Queue AI structure generation for object' })
  async generateStructure(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
  ) {
    const data = await this.commandBus.execute(
      new GenerateLocalizationObjectStructureCommand(
        user.tenantId,
        projectId,
        objectId,
      ),
    );
    return successResponse(data);
  }

  @Post(':objectId/apply-template')
  @ApiOperation({ summary: 'Apply built-in template to object tree' })
  async applyTemplate(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('objectId') objectId: string,
    @Body() dto: ApplyLocalizationObjectTemplateDto,
  ) {
    const data = await this.commandBus.execute(
      new ApplyLocalizationObjectTemplateCommand(
        user.tenantId,
        projectId,
        objectId,
        dto.templateId,
      ),
    );
    return successResponse(data);
  }
}
