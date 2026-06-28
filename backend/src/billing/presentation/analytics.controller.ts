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
  GetAccountUsageQuery,
  GetUsageAnalyticsQuery,
  GetUsageSummaryQuery,
  GetUsageTimelineQuery,
} from '../application/usage-analytics.service';
import {
  GetTrafficSummaryQuery,
  GetTrafficTimelineQuery,
} from '../../shared/monitoring/api-traffic.service';
import {
  GetQualityLogsQuery,
  GetQualitySummaryQuery,
} from '../application/translation-quality.service';
import { GetMemoryCacheSummaryQuery } from '../application/memory-analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('account')
  @ApiOperation({
    summary: 'Tenant subscription and lifetime AI usage (all roles)',
  })
  async account(@CurrentUser() user: AuthUser) {
    const data = await this.queryBus.execute(
      new GetAccountUsageQuery(user.tenantId),
    );
    return successResponse(data);
  }

  @Get('usage')
  @Roles(UserRole.admin, UserRole.developer)
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
  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'AI usage summary by provider, model, and user' })
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

  @Get('usage/timeline')
  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'Daily AI token usage timeline' })
  async usageTimeline(
    @CurrentUser() user: AuthUser,
    @Query() query: { days?: string; projectId?: string },
  ) {
    const days = query.days ? Number(query.days) : 30;
    const data = await this.queryBus.execute(
      new GetUsageTimelineQuery(user.tenantId, days, query.projectId),
    );
    return successResponse(data);
  }

  @Get('traffic/summary')
  @Roles(UserRole.admin, UserRole.developer)
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
  @Roles(UserRole.admin, UserRole.developer)
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
  @Roles(UserRole.admin, UserRole.developer)
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
  @Roles(UserRole.admin, UserRole.developer)
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

  @Get('cache/summary')
  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'Translation memory cache hit summary' })
  async cacheSummary(
    @CurrentUser() user: AuthUser,
    @Query() query: { projectId?: string; from?: string; to?: string },
  ) {
    const data = await this.queryBus.execute(
      new GetMemoryCacheSummaryQuery(
        user.tenantId,
        query.projectId,
        query.from ? new Date(query.from) : undefined,
        query.to ? new Date(query.to) : undefined,
      ),
    );
    return successResponse(data);
  }
}
