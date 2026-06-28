import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import {
  AnalyzeGlossaryCommand,
  ApproveGlossarySuggestionCommand,
  ListGlossarySuggestionsQuery,
  RejectGlossarySuggestionCommand,
} from '../application/glossary-suggestion.commands';

@ApiTags('glossary')
@ApiBearerAuth()
@Controller('projects/:projectId/glossary/suggestions')
export class GlossarySuggestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List glossary suggestions for a project' })
  async list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: { status?: 'pending' | 'approved' | 'rejected' },
  ) {
    const data = await this.queryBus.execute(
      new ListGlossarySuggestionsQuery(user.tenantId, projectId, query.status),
    );
    return successResponse(data);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze translations and suggest glossary terms' })
  async analyze(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.commandBus.execute(
      new AnalyzeGlossaryCommand(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Post(':suggestionId/approve')
  @ApiOperation({ summary: 'Approve a glossary suggestion' })
  async approve(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('suggestionId') suggestionId: string,
  ) {
    const data = await this.commandBus.execute(
      new ApproveGlossarySuggestionCommand(
        user.tenantId,
        projectId,
        suggestionId,
      ),
    );
    return successResponse(data);
  }

  @Post(':suggestionId/reject')
  @ApiOperation({ summary: 'Reject a glossary suggestion' })
  async reject(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('suggestionId') suggestionId: string,
  ) {
    const data = await this.commandBus.execute(
      new RejectGlossarySuggestionCommand(
        user.tenantId,
        projectId,
        suggestionId,
      ),
    );
    return successResponse(data);
  }
}
