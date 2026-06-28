import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let metrics: MetricsService;

  beforeEach(() => {
    metrics = new MetricsService();
    metrics.onModuleInit();
  });

  it('exposes prometheus metrics output', async () => {
    metrics.recordHttpRequest('GET', '/api/v1/health', 200, 0.05);
    metrics.recordTranslationJobItem('completed');
    metrics.recordWebhookDelivery(true);
    metrics.recordAiUsage('openai', 0.002, false);
    metrics.recordMemoryHit('exact');
    metrics.setQueueDepth('translation.process', 3, 1, 0);

    const output = await metrics.getMetrics();

    expect(output).toContain('http_requests_total');
    expect(output).toContain('translation_job_items_total');
    expect(output).toContain('webhook_deliveries_total');
    expect(output).toContain('ai_usage_cost_usd_total');
    expect(output).toContain('memory_hits_total');
    expect(output).toContain('queue_jobs_waiting');
  });
});
