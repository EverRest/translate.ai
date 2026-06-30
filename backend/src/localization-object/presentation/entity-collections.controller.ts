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
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import {
  CreateEntityCollectionCommand,
  DeleteEntityCollectionCommand,
  ImportOpenApiCommand,
  ListEntityCollectionsQuery,
  PreviewOpenApiImportQuery,
  UpdateEntityCollectionCommand,
} from '../application/entity-collection.commands';
import {
  CreateEntityCollectionDto,
  OpenApiImportDto,
  OpenApiPreviewDto,
  UpdateEntityCollectionDto,
} from './dto/entity-collection.dto';

@ApiTags('entity-collections')
@ApiBearerAuth()
@AllowApiKey()
@Controller('projects/:projectId/collections')
export class EntityCollectionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List entity collections' })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new ListEntityCollectionsQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create entity collection' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateEntityCollectionDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateEntityCollectionCommand(
        user.tenantId,
        projectId,
        dto.slug,
        dto.name,
        dto.description,
      ),
    );
    return successResponse(data);
  }

  @Patch(':collectionId')
  @ApiOperation({ summary: 'Update entity collection' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('collectionId') collectionId: string,
    @Body() dto: UpdateEntityCollectionDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateEntityCollectionCommand(
        user.tenantId,
        projectId,
        collectionId,
        dto.name,
        dto.description,
      ),
    );
    return successResponse(data);
  }

  @Delete(':collectionId')
  @ApiOperation({ summary: 'Delete entity collection' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('collectionId') collectionId: string,
  ) {
    const data = await this.commandBus.execute(
      new DeleteEntityCollectionCommand(
        user.tenantId,
        projectId,
        collectionId,
      ),
    );
    return successResponse(data);
  }

  @Post(':collectionId/import/openapi/preview')
  @ApiOperation({ summary: 'Preview OpenAPI import into collection' })
  async previewOpenApi(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('collectionId') collectionId: string,
    @Body() dto: OpenApiPreviewDto,
  ) {
    const data = await this.queryBus.execute(
      new PreviewOpenApiImportQuery(
        user.tenantId,
        projectId,
        collectionId,
        dto.spec,
        dto.selectedTags,
      ),
    );
    return successResponse(data);
  }

  @Post(':collectionId/import/openapi')
  @ApiOperation({ summary: 'Import entities from OpenAPI spec' })
  async importOpenApi(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('collectionId') collectionId: string,
    @Body() dto: OpenApiImportDto,
  ) {
    const data = await this.commandBus.execute(
      new ImportOpenApiCommand(
        user.tenantId,
        projectId,
        collectionId,
        dto.spec,
        dto.selectedTags,
        dto.materialize ?? false,
      ),
    );
    return successResponse(data);
  }
}
