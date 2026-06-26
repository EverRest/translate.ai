import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AiUsageService } from './application/ai-usage.service';
import {
  GetUsageAnalyticsHandler,
  GetUsageSummaryHandler,
} from './application/handlers/usage-analytics.handlers';
import {
  GetQualityLogsHandler,
  GetQualitySummaryHandler,
} from './application/handlers/quality-analytics.handlers';
import {
  GetTrafficSummaryHandler,
  GetTrafficTimelineHandler,
} from './application/handlers/traffic-analytics.handlers';
import { TranslationQualityService } from './application/translation-quality.service';
import { UsageAnalyticsService } from './application/usage-analytics.service';
import { AnalyticsController } from './presentation/analytics.controller';

@Module({
  imports: [CqrsModule],
  controllers: [AnalyticsController],
  providers: [
    AiUsageService,
    UsageAnalyticsService,
    TranslationQualityService,
    GetUsageAnalyticsHandler,
    GetUsageSummaryHandler,
    GetTrafficSummaryHandler,
    GetTrafficTimelineHandler,
    GetQualitySummaryHandler,
    GetQualityLogsHandler,
  ],
  exports: [AiUsageService, TranslationQualityService],
})
export class BillingModule {}
