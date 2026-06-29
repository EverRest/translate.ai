import { ConfigService } from '@nestjs/config';

export function buildBullRootConfig(config: ConfigService) {
  const prefix = config.get<string>('BULLMQ_PREFIX')?.trim();

  return {
    connection: {
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
    },
    ...(prefix ? { prefix } : {}),
  };
}
