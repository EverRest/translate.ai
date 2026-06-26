import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  GetQualityLogsQuery,
  GetQualitySummaryQuery,
  TranslationQualityService,
} from '../translation-quality.service';

@Injectable()
@QueryHandler(GetQualitySummaryQuery)
export class GetQualitySummaryHandler implements IQueryHandler<GetQualitySummaryQuery> {
  constructor(private readonly quality: TranslationQualityService) {}

  execute(query: GetQualitySummaryQuery) {
    return this.quality.getSummary(query);
  }
}

@Injectable()
@QueryHandler(GetQualityLogsQuery)
export class GetQualityLogsHandler implements IQueryHandler<GetQualityLogsQuery> {
  constructor(private readonly quality: TranslationQualityService) {}

  execute(query: GetQualityLogsQuery) {
    return this.quality.getLogs(query);
  }
}
