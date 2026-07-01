import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { WorkerModule } from '../src/worker/worker.module';

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

async function waitForJob(
  app: INestApplication<App>,
  token: string,
  jobId: string,
  timeoutMs = 30_000,
) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const job = response.body.data as { status: string };

    if (job.status === 'completed') {
      return job;
    }

    if (job.status === 'failed' || job.status === 'cancelled') {
      throw new Error(`Job ended with status ${job.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`);
}

describe('Stale translations (e2e)', () => {
  jest.setTimeout(60_000);

  let app: INestApplication<App>;
  let workerContext: Awaited<
    ReturnType<typeof NestFactory.createApplicationContext>
  >;
  let token: string;
  let projectId: string;
  let keyId: string;

  beforeAll(async () => {
    process.env.MOCK_TRANSLATIONS = 'true';
    app = await createTestApp();
    app.get(ConfigService).set('MOCK_TRANSLATIONS', true);
    workerContext = await NestFactory.createApplicationContext(WorkerModule);
    workerContext.get(ConfigService).set('MOCK_TRANSLATIONS', true);
  });

  afterAll(async () => {
    await workerContext.close();
    await app.close();
  });

  it('registers tenant and sets up project with translated key', async () => {
    const suffix = Date.now();
    const authResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        tenantName: `Stale Org ${suffix}`,
        email: `stale-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    token = authResponse.body.data.accessToken as string;

    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Stale Project ${suffix}` })
      .expect(201);

    projectId = projectResponse.body.data.id as string;

    const keyResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/keys`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: 'label.name',
        sourceText: 'First Name',
      })
      .expect(201);

    keyId = keyResponse.body.data.id as string;

    const jobResponse = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId,
        languages: ['fr'],
        keys: ['label.name'],
      })
      .expect(201);

    await waitForJob(app, token, jobResponse.body.data.jobId as string);
  });

  it('marks translations stale after source text change', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}/keys/${keyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ sourceText: 'Given Name' })
      .expect(200);

    const translationsResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/translations`)
      .query({ language: 'fr' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const items = translationsResponse.body.data.items as Array<{
      status: string;
      isStale: boolean;
    }>;

    expect(items.length).toBeGreaterThan(0);
    expect(items[0].status).toBe('review');
    expect(items[0].isStale).toBe(true);

    const summaryResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/translations/stale-summary`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const summary = summaryResponse.body.data as {
      totalStaleKeys: number;
      totalStaleTranslations: number;
    };

    expect(summary.totalStaleKeys).toBe(1);
    expect(summary.totalStaleTranslations).toBe(1);

    const hintsResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/translations/stale-key-hints`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const keyIds = hintsResponse.body.data.keyIds as string[];
    expect(keyIds).toContain(keyId);
  });

  it('creates onlyStale job for stale translations', async () => {
    const jobResponse = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId,
        languages: ['fr'],
        onlyStale: true,
      })
      .expect(201);

    const job = await waitForJob(
      app,
      token,
      jobResponse.body.data.jobId as string,
    );

    expect(job).toBeTruthy();

    const summaryResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/translations/stale-summary`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const summary = summaryResponse.body.data as {
      totalStaleTranslations: number;
    };

    expect(summary.totalStaleTranslations).toBe(0);
  });
});
