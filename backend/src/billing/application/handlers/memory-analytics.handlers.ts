import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  GetMemoryCacheSummaryQuery,
  MemoryAnalyticsService,
} from '../memory-analytics.service';

@Injectable()
@QueryHandler(GetMemoryCacheSummaryQuery)
export class GetMemoryCacheSummaryHandler implements IQueryHandler<GetMemoryCacheSummaryQuery> {
  constructor(private readonly analytics: MemoryAnalyticsService) {}

  execute(query: GetMemoryCacheSummaryQuery) {
    return this.analytics.getSummary(query);
  }
}
