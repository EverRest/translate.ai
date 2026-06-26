import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly health: HealthIndicatorService,
    private readonly config: ConfigService,
  ) {}

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.health.check(key);
    const client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
      lazyConnect: true,
    });

    try {
      await client.connect();
      const pong = await client.ping();
      if (pong !== 'PONG') {
        return indicator.down({
          message: `Unexpected ping response: ${String(pong)}`,
        });
      }
      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      client.disconnect();
    }
  }
}
