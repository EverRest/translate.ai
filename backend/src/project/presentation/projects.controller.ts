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
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import {
  paginatedResponse,
  successResponse,
} from '../../shared/presentation/api-response';
import { parsePagination } from '../../shared/utils/string.utils';
import {
  ArchiveProjectCommand,
  CreateProjectCommand,
  UpdateProjectCommand,
} from '../application/commands/project.commands';
import {
  GetProjectQuery,
  ListProjectsQuery,
} from '../application/queries/project.queries';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List projects for current tenant' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: { page?: string; limit?: string },
  ) {
    const { page, limit } = parsePagination(query);
    const data = await this.queryBus.execute(
      new ListProjectsQuery(user.tenantId, page, limit),
    );
    return paginatedResponse(data.items, page, limit, data.meta.total);
  }

  @Post()
  @ApiOperation({ summary: 'Create project' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    const data = await this.commandBus.execute(
      new CreateProjectCommand(user.tenantId, dto.name, dto.description),
    );
    return successResponse(data);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get project by id' })
  async get(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetProjectQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Update project' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const data = await this.commandBus.execute(
      new UpdateProjectCommand(
        user.tenantId,
        projectId,
        dto.name,
        dto.description,
      ),
    );
    return successResponse(data);
  }

  @Delete(':projectId')
  @ApiOperation({ summary: 'Archive project' })
  async archive(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.commandBus.execute(
      new ArchiveProjectCommand(user.tenantId, projectId),
    );
    return successResponse(data);
  }
}
