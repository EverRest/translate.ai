import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  ApiTrafficService,
  GetTrafficSummaryQuery,
  GetTrafficTimelineQuery,
} from '../../../shared/monitoring/api-traffic.service';

@Injectable()
@QueryHandler(GetTrafficSummaryQuery)
export class GetTrafficSummaryHandler implements IQueryHandler<GetTrafficSummaryQuery> {
  constructor(private readonly traffic: ApiTrafficService) {}

  execute(query: GetTrafficSummaryQuery) {
    return this.traffic.getSummary(query);
  }
}

@Injectable()
@QueryHandler(GetTrafficTimelineQuery)
export class GetTrafficTimelineHandler implements IQueryHandler<GetTrafficTimelineQuery> {
  constructor(private readonly traffic: ApiTrafficService) {}

  execute(query: GetTrafficTimelineQuery) {
    return this.traffic.getTimeline(query);
  }
}
