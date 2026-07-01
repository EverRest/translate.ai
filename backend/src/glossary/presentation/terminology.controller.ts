import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import {
  CountTerminologyDriftIssuesQuery,
  GetTerminologyDriftKeyHintsQuery,
  ListTerminologyDriftIssuesQuery,
  ResolveTerminologyDriftIssueCommand,
  ScanTerminologyDriftCommand,
} from '../application/terminology-drift.commands';

class ResolveTerminologyDriftDto {
  @IsString()
  @MinLength(1)
  canonicalTranslation!: string;
}

@ApiTags('terminology')
@ApiBearerAuth()
@Controller('projects/:projectId/terminology')
export class TerminologyController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('scan')
  @ApiOperation({ summary: 'Enqueue terminology drift scan for a project' })
  async scan(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.commandBus.execute(
      new ScanTerminologyDriftCommand(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Get('issues')
  @ApiOperation({ summary: 'List terminology drift issues' })
  async listIssues(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: { status?: 'open' | 'resolved' | 'all' },
  ) {
    const data = await this.queryBus.execute(
      new ListTerminologyDriftIssuesQuery(
        user.tenantId,
        projectId,
        query.status ?? 'open',
      ),
    );
    return successResponse(data);
  }

  @Get('issues/count')
  @ApiOperation({ summary: 'Count open terminology drift issues' })
  async countIssues(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new CountTerminologyDriftIssuesQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Get('key-hints')
  @ApiOperation({
    summary: 'List translation keys referenced by open drift issues',
  })
  async keyHints(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetTerminologyDriftKeyHintsQuery(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Post('issues/:issueId/resolve')
  @ApiOperation({
    summary: 'Resolve drift issue by promoting a canonical glossary term',
  })
  async resolve(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Body() dto: ResolveTerminologyDriftDto,
  ) {
    const data = await this.commandBus.execute(
      new ResolveTerminologyDriftIssueCommand(
        user.tenantId,
        projectId,
        issueId,
        dto.canonicalTranslation,
      ),
    );
    return successResponse(data);
  }
}
