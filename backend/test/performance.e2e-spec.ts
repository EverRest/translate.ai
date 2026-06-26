import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api', { exclude: ['metrics'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[index] ?? 0;
}

describe('Performance (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('health endpoint stays under latency budget', async () => {
    const iterations = 50;
    const durations: number[] = [];

    for (let index = 0; index < iterations; index += 1) {
      const started = performance.now();
      await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      durations.push(performance.now() - started);
    }

    const p95 = percentile(durations, 95);
    const avg =
      durations.reduce((sum, value) => sum + value, 0) / durations.length;

    expect(p95).toBeLessThan(500);
    expect(avg).toBeLessThan(250);
  });
});
