import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { AllowApiKey } from '../../shared/auth/decorators/allow-api-key.decorator';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { successResponse } from '../../shared/presentation/api-response';
import { GetCoverageMatrixQuery } from '../application/coverage-matrix.queries';
import {
  CoverageMatrixQueryDto,
  CoverageMatrixResponseDto,
} from './dto/coverage-matrix.dto';

@ApiTags('reports')
@ApiBearerAuth()
@AllowApiKey()
@Controller('projects/:projectId/reports')
export class ReportsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('coverage-matrix')
  @ApiOperation({
    summary: 'Scope × language translation coverage matrix',
    description:
      'Aggregates keys by imported scope (from key context) and translation status per language. RAG: green ≥95% approved, yellow 70–94%, red <70%.',
  })
  @ApiOkResponse({ type: CoverageMatrixResponseDto })
  async coverageMatrix(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query() query: CoverageMatrixQueryDto,
  ) {
    const scopes = query.scopes
      ? query.scopes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const languages = query.languages
      ? query.languages
          .split(',')
          .map((l) => l.trim().toLowerCase())
          .filter(Boolean)
      : undefined;

    const data = await this.queryBus.execute(
      new GetCoverageMatrixQuery(user.tenantId, projectId, scopes, languages),
    );
    return successResponse(data);
  }
}
