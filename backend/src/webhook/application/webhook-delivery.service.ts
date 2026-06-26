import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { MetricsService } from '../../shared/monitoring/metrics.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { WebhookSendJobPayload } from '../../shared/constants/job-payloads';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  async deliver(payload: WebhookSendJobPayload): Promise<void> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id: payload.webhookId },
    });

    if (!webhook || !webhook.enabled) {
      return;
    }

    const body = JSON.stringify({
      event: payload.event,
      eventId: payload.eventId,
      timestamp: new Date().toISOString(),
      data: payload.data,
    });

    const signature = createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': payload.event,
          ...(payload.correlationId
            ? { 'X-Request-Id': payload.correlationId }
            : {}),
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Webhook returned HTTP ${response.status}`);
      }

      this.metrics.recordWebhookDelivery(true);
      this.logger.log(
        `Webhook delivered: ${payload.event} → ${webhook.url} (${response.status})`,
      );
    } catch (error) {
      this.metrics.recordWebhookDelivery(false);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
