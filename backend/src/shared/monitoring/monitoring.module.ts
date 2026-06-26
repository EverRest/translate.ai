import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { ApiTrafficService } from './api-traffic.service';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { QueueMetricsService } from './queue-metrics.service';
import { RedisHealthIndicator } from './redis.health';

@Global()
@Module({
  imports: [TerminusModule],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    ApiTrafficService,
    QueueMetricsService,
    RedisHealthIndicator,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
  exports: [MetricsService, ApiTrafficService, RedisHealthIndicator],
})
export class MonitoringModule {}
