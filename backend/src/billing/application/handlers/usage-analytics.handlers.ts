import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  GetUsageAnalyticsQuery,
  GetUsageSummaryQuery,
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
