import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();

  readonly httpRequestsTotal: Counter<'method' | 'route' | 'status'>;
  readonly httpRequestDuration: Histogram<'method' | 'route' | 'status'>;
  readonly translationJobItemsTotal: Counter<'status'>;
  readonly webhookDeliveriesTotal: Counter<'status'>;
  readonly aiUsageCostUsdTotal: Counter<'provider' | 'used_fallback'>;
  readonly memoryHitsTotal: Counter<'hit_type'>;
  readonly queueJobsWaiting: Gauge<'queue'>;
  readonly queueJobsActive: Gauge<'queue'>;
  readonly queueJobsFailed: Gauge<'queue'>;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.translationJobItemsTotal = new Counter({
      name: 'translation_job_items_total',
      help: 'Translation job item outcomes',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.webhookDeliveriesTotal = new Counter({
      name: 'webhook_deliveries_total',
      help: 'Webhook delivery outcomes',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.aiUsageCostUsdTotal = new Counter({
      name: 'ai_usage_cost_usd_total',
      help: 'Estimated AI usage cost in USD',
      labelNames: ['provider', 'used_fallback'],
      registers: [this.registry],
    });

    this.memoryHitsTotal = new Counter({
      name: 'memory_hits_total',
      help: 'Translation memory cache hits',
      labelNames: ['hit_type'],
      registers: [this.registry],
    });

    this.queueJobsWaiting = new Gauge({
      name: 'queue_jobs_waiting',
      help: 'Jobs waiting in BullMQ queue',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.queueJobsActive = new Gauge({
      name: 'queue_jobs_active',
      help: 'Jobs active in BullMQ queue',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.queueJobsFailed = new Gauge({
      name: 'queue_jobs_failed',
      help: 'Failed jobs in BullMQ queue',
      labelNames: ['queue'],
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry, prefix: 'translate_ai_' });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = {
      method,
      route,
      status: String(statusCode),
    };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);
  }

  recordTranslationJobItem(status: 'completed' | 'failed'): void {
    this.translationJobItemsTotal.inc({ status });
  }

  recordWebhookDelivery(success: boolean): void {
    this.webhookDeliveriesTotal.inc({
      status: success ? 'success' : 'failure',
    });
  }

  recordAiUsage(
    provider: string,
    costUsd: number,
    usedFallback: boolean,
  ): void {
    this.aiUsageCostUsdTotal.inc(
      { provider, used_fallback: String(usedFallback) },
      costUsd,
    );
  }

  recordMemoryHit(hitType: 'exact' | 'semantic'): void {
    this.memoryHitsTotal.inc({ hit_type: hitType });
  }

  setQueueDepth(
    queue: string,
    waiting: number,
    active: number,
    failed: number,
  ): void {
    this.queueJobsWaiting.set({ queue }, waiting);
    this.queueJobsActive.set({ queue }, active);
    this.queueJobsFailed.set({ queue }, failed);
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
