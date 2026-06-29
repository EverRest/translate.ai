import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import {
  paginatedResponse,
  successResponse,
} from '../../shared/presentation/api-response';
import { parsePagination } from '../../shared/utils/string.utils';
import {
  BulkUpsertGlossaryTermsCommand,
  CreateGlossaryTermCommand,
  DeleteGlossaryTermCommand,
  ListGlossaryTermsQuery,
  UpdateGlossaryTermCommand,
  UpsertGlossaryTermCommand,
} from '../application/glossary.commands';
import {
  BulkUpsertGlossaryTermsDto,
  CreateGlossaryTermDto,
  UpdateGlossaryTermDto,
  UpsertGlossaryTermDto,
} from './dto/glossary.dto';

@ApiTags('glossary')
@ApiBearerAuth()
@Controller('projects/:projectId/glossary/terms')
export class GlossaryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List glossary terms for a project' })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: { page?: string; limit?: string; search?: string; glossaryId?: string },
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new ListGlossaryTermsQuery(
        user.tenantId,
        projectId,
        page,
        limit,
        query.search,
        query.glossaryId,
      ),
    );
    return paginatedResponse(data.items, page, limit, data.meta.total);
  }

  @Post()
  @ApiOperation({ summary: 'Create a glossary term' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateGlossaryTermDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateGlossaryTermCommand(
        user.tenantId,
        projectId,
        dto.sourceTerm,
        dto.targetTerm,
        dto.doNotTranslate ?? false,
        dto.note,
      ),
    );
    return successResponse(data);
  }

  @Put('upsert')
  @ApiOperation({ summary: 'Create or update a glossary term by sourceTerm' })
  async upsert(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpsertGlossaryTermDto,
  ) {
    const data = await this.commandBus.execute(
      new UpsertGlossaryTermCommand(
        user.tenantId,
        projectId,
        dto.sourceTerm,
        dto.targetTerm,
        dto.doNotTranslate,
        dto.note,
      ),
    );
    return successResponse(data);
  }

  @Post('bulk-upsert')
  @ApiOperation({ summary: 'Bulk create or update glossary terms (max 200)' })
  async bulkUpsert(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: BulkUpsertGlossaryTermsDto,
  ) {
    const data = await this.commandBus.execute(
      new BulkUpsertGlossaryTermsCommand(
        user.tenantId,
        projectId,
        dto.terms,
      ),
    );
    return successResponse(data);
  }

  @Patch(':termId')
  @ApiOperation({ summary: 'Update a glossary term' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('termId') termId: string,
    @Body() dto: UpdateGlossaryTermDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateGlossaryTermCommand(
        user.tenantId,
        projectId,
        termId,
        dto.sourceTerm,
        dto.targetTerm,
        dto.doNotTranslate,
        dto.note,
      ),
    );
    return successResponse(data);
  }

  @Delete(':termId')
  @ApiOperation({ summary: 'Delete a glossary term' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('termId') termId: string,
  ) {
    const data = await this.commandBus.execute(
      new DeleteGlossaryTermCommand(user.tenantId, projectId, termId),
    );
    return successResponse(data);
  }
}
