import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  GetAccountUsageQuery,
  GetUsageAnalyticsQuery,
  GetUsageSummaryQuery,
  GetUsageTimelineQuery,
  UsageAnalyticsService,
} from '../usage-analytics.service';

@Injectable()
@QueryHandler(GetUsageAnalyticsQuery)
export class GetUsageAnalyticsHandler implements IQueryHandler<GetUsageAnalyticsQuery> {
  constructor(private readonly analytics: UsageAnalyticsService) {}

  execute(query: GetUsageAnalyticsQuery) {
    return this.analytics.getLogs(query);
  }
}

@Injectable()
@QueryHandler(GetUsageSummaryQuery)
export class GetUsageSummaryHandler implements IQueryHandler<GetUsageSummaryQuery> {
  constructor(private readonly analytics: UsageAnalyticsService) {}

  execute(query: GetUsageSummaryQuery) {
    return this.analytics.getSummary(query);
  }
}

@Injectable()
@QueryHandler(GetUsageTimelineQuery)
export class GetUsageTimelineHandler implements IQueryHandler<GetUsageTimelineQuery> {
  constructor(private readonly analytics: UsageAnalyticsService) {}

  execute(query: GetUsageTimelineQuery) {
    return this.analytics.getTimeline(query);
  }
}

@Injectable()
@QueryHandler(GetAccountUsageQuery)
export class GetAccountUsageHandler implements IQueryHandler<GetAccountUsageQuery> {
  constructor(private readonly analytics: UsageAnalyticsService) {}

  execute(query: GetAccountUsageQuery) {
    return this.analytics.getAccountUsage(query);
  }
}
