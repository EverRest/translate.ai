import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import {
  ActivateGlossaryCommand,
  CreateGlossaryCommand,
  ListGlossariesQuery,
} from '../application/glossary-set.commands';
import { CreateGlossaryDto } from './dto/glossary-set.dto';

@ApiTags('glossary')
@ApiBearerAuth()
@Controller('projects/:projectId/glossaries')
export class GlossarySetsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List glossary sets for a project' })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new ListGlossariesQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create a glossary set' })
  async create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateGlossaryDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateGlossaryCommand(
        user.tenantId,
        projectId,
        dto.name,
        dto.cloneFromActive ?? false,
      ),
    );
    return successResponse(data);
  }

  @Post(':glossaryId/activate')
  @ApiOperation({ summary: 'Activate a glossary set for translation jobs' })
  async activate(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('glossaryId') glossaryId: string,
  ) {
    const data = await this.commandBus.execute(
      new ActivateGlossaryCommand(user.tenantId, projectId, glossaryId),
    );
    return successResponse(data);
  }
}
