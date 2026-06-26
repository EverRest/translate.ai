import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { Roles } from '../../shared/auth/decorators/roles.decorator';
import { RolesGuard } from '../../shared/auth/guards/roles.guard';
import { successResponse } from '../../shared/presentation/api-response';
import {
  GetUsageAnalyticsQuery,
  GetUsageSummaryQuery,
} from '../application/usage-analytics.service';
import {
  GetTrafficSummaryQuery,
  GetTrafficTimelineQuery,
} from '../../shared/monitoring/api-traffic.service';
import {
  GetQualityLogsQuery,
  GetQualitySummaryQuery,
} from '../application/translation-quality.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.admin, UserRole.developer)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('usage')
  @ApiOperation({ summary: 'List AI usage log entries' })
  async usage(
    @CurrentUser() user: AuthUser,
    @Query() query: { projectId?: string; from?: string; to?: string },
  ) {
    const data = await this.queryBus.execute(
      new GetUsageAnalyticsQuery(
        user.tenantId,
        query.projectId,
        query.from ? new Date(query.from) : undefined,
        query.to ? new Date(query.to) : undefined,
      ),
    );
    return successResponse({ items: data });
  }

  @Get('usage/summary')
  @ApiOperation({ summary: 'AI usage cost summary by provider' })
  async summary(
    @CurrentUser() user: AuthUser,
    @Query() query: { projectId?: string; from?: string; to?: string },
  ) {
    const data = await this.queryBus.execute(
      new GetUsageSummaryQuery(
        user.tenantId,
        query.projectId,
        query.from ? new Date(query.from) : undefined,
        query.to ? new Date(query.to) : undefined,
      ),
    );
    return successResponse(data);
  }

  @Get('traffic/summary')
  @ApiOperation({ summary: 'API request traffic summary for tenant' })
  async trafficSummary(
    @CurrentUser() user: AuthUser,
    @Query() query: { hours?: string },
  ) {
    const hours = query.hours ? Number(query.hours) : 24;
    const data = await this.queryBus.execute(
      new GetTrafficSummaryQuery(user.tenantId, hours),
    );
    return successResponse(data);
  }

  @Get('traffic/timeline')
  @ApiOperation({ summary: 'Hourly API request counts for tenant' })
  async trafficTimeline(
    @CurrentUser() user: AuthUser,
    @Query() query: { hours?: string },
  ) {
    const hours = query.hours ? Number(query.hours) : 24;
    const data = await this.queryBus.execute(
      new GetTrafficTimelineQuery(user.tenantId, hours),
    );
    return successResponse(data);
  }

  @Get('quality/summary')
  @ApiOperation({ summary: 'AI translation accuracy summary' })
  async qualitySummary(
    @CurrentUser() user: AuthUser,
    @Query() query: { projectId?: string; from?: string; to?: string },
  ) {
    const data = await this.queryBus.execute(
      new GetQualitySummaryQuery(
        user.tenantId,
        query.projectId,
        query.from ? new Date(query.from) : undefined,
        query.to ? new Date(query.to) : undefined,
      ),
    );
    return successResponse(data);
  }

  @Get('quality/logs')
  @ApiOperation({ summary: 'Recent AI accuracy samples' })
  async qualityLogs(
    @CurrentUser() user: AuthUser,
    @Query()
    query: {
      projectId?: string;
      from?: string;
      to?: string;
      limit?: string;
    },
  ) {
    const data = await this.queryBus.execute(
      new GetQualityLogsQuery(
        user.tenantId,
        query.projectId,
        query.from ? new Date(query.from) : undefined,
        query.to ? new Date(query.to) : undefined,
        query.limit ? Number(query.limit) : 100,
      ),
    );
    return successResponse({ items: data });
  }
}
