import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TerminologyIssueStatus } from '@prisma/client';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import {
  DismissTerminologyIssueCommand,
  ListTerminologyIssuesQuery,
  ResolveTerminologyIssueCommand,
  ScanTerminologyCommand,
} from '../application/terminology-drift.commands';
import { ResolveTerminologyIssueDto } from './dto/terminology-drift.dto';

@ApiTags('glossary')
@ApiBearerAuth()
@Controller('projects/:projectId/terminology')
export class TerminologyDriftController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('scan')
  @ApiOperation({ summary: 'Queue terminology drift scan' })
  async scan(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.commandBus.execute(
      new ScanTerminologyCommand(user.tenantId, projectId),
    );
    return successResponse(data);
  }

  @Get('issues')
  @ApiOperation({ summary: 'List terminology drift issues' })
  async listIssues(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query('status') status?: TerminologyIssueStatus,
  ) {
    const data = await this.queryBus.execute(
      new ListTerminologyIssuesQuery(user.tenantId, projectId, status),
    );
    return successResponse(data);
  }

  @Post('issues/:issueId/resolve')
  @ApiOperation({ summary: 'Resolve drift issue with canonical term' })
  async resolve(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Body() dto: ResolveTerminologyIssueDto,
  ) {
    const data = await this.commandBus.execute(
      new ResolveTerminologyIssueCommand(
        user.tenantId,
        projectId,
        issueId,
        dto.canonicalValue,
        dto.addToGlossary ?? true,
        dto.retranslate ?? false,
        user.userId,
      ),
    );
    return successResponse(data);
  }

  @Post('issues/:issueId/dismiss')
  @ApiOperation({ summary: 'Dismiss terminology drift issue' })
  async dismiss(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ) {
    const data = await this.commandBus.execute(
      new DismissTerminologyIssueCommand(user.tenantId, projectId, issueId),
    );
    return successResponse(data);
  }
}
