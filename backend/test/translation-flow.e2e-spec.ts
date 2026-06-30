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

    const job = response.body.data as {
      status: string;
      progress: { total: number; completed: number; failed: number };
      failedItems?: Array<{
        key: string;
        language: string;
        errorMessage: string | null;
      }>;
    };

    if (job.status === 'completed') {
      return job;
    }

    if (job.status === 'failed' || job.status === 'cancelled') {
      const details =
        job.failedItems
          ?.map(
            (item) =>
              `${item.key} (${item.language}): ${item.errorMessage ?? 'unknown'}`,
          )
          .join('; ') ?? 'no item details';
      throw new Error(`Job ended with status ${job.status}: ${details}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`);
}

describe('Translation flow (e2e)', () => {
  jest.setTimeout(60_000);

  let app: INestApplication<App>;
  let workerContext: Awaited<
    ReturnType<typeof NestFactory.createApplicationContext>
  >;
  let token: string;
  let projectId: string;

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

  it('registers tenant and obtains token', async () => {
    const suffix = Date.now();
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        tenantName: `Flow Org ${suffix}`,
        email: `flow-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    token = response.body.data.accessToken as string;
    expect(token).toBeTruthy();
  });

  it('creates project and translation key', async () => {
    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Flow Project ${Date.now()}` })
      .expect(201);

    projectId = projectResponse.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/keys`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: 'greeting.hello',
        sourceText: 'Hello world',
        description: 'E2E greeting',
      })
      .expect(201);
  });

  it('creates job from inline keyItems without pre-configured keys or languages', async () => {
    const emptyProjectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Inline Flow ${Date.now()}` })
      .expect(201);

    const inlineProjectId = emptyProjectResponse.body.data.id as string;

    const jobResponse = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: inlineProjectId,
        languages: ['fr'],
        keyItems: [
          {
            key: 'welcome.title',
            sourceText: 'Welcome aboard',
          },
        ],
      })
      .expect(201);

    const jobId = jobResponse.body.data.jobId as string;
    const job = await waitForJob(app, token, jobId);

    expect(job.progress.completed).toBe(1);
    expect(job.progress.failed).toBe(0);

    const languagesResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${inlineProjectId}/languages`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const languageItems = languagesResponse.body.data.items as {
      code: string;
    }[];
    expect(languageItems.map((item) => item.code)).toContain('fr');

    const keysResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${inlineProjectId}/keys`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(keysResponse.body.data.items[0].key).toBe('welcome.title');
  });

  it('creates job via project API key without JWT', async () => {
    const apiKeyResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/api-keys`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E integration' })
      .expect(201);

    const apiKeySecret = apiKeyResponse.body.data.secret as string;
    expect(apiKeySecret).toMatch(/^ta_live_/);

    const jobResponse = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${apiKeySecret}`)
      .send({
        languages: ['it'],
        keyItems: [
          {
            key: 'api.key.flow',
            sourceText: 'API key flow works',
          },
        ],
      })
      .expect(201);

    const jobId = jobResponse.body.data.jobId as string;
    const job = await waitForJob(app, token, jobId);

    expect(job.progress.completed).toBe(1);
    expect(job.progress.failed).toBe(0);
  });

  it('rejects API key when accessing another project export', async () => {
    const otherProjectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Other ${Date.now()}` })
      .expect(201);

    const otherProjectId = otherProjectResponse.body.data.id as string;

    const apiKeyResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/api-keys`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'scoped-key' })
      .expect(201);

    const apiKeySecret = apiKeyResponse.body.data.secret as string;

    await request(app.getHttpServer())
      .get(`/api/v1/projects/${otherProjectId}/export?format=json&language=de`)
      .set('Authorization', `Bearer ${apiKeySecret}`)
      .expect(403);
  });

  it('creates job, processes via worker, and exports translation', async () => {
    const jobResponse = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId,
        languages: ['de'],
        keys: ['greeting.hello'],
      })
      .expect(201);

    const jobId = jobResponse.body.data.jobId as string;
    const job = await waitForJob(app, token, jobId);

    expect(job.progress.completed).toBe(1);
    expect(job.progress.failed).toBe(0);

    const exportResponse = await request(app.getHttpServer())
      .get(
        `/api/v1/projects/${projectId}/export?format=json&language=de&status=draft`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const payload = JSON.parse(exportResponse.text) as Record<string, string>;
    expect(payload['greeting.hello']).toBe('[de] Hello world');

    const lookupResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/translations/lookup`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ key: 'greeting.hello', language: 'de' }],
      })
      .expect(201);

    expect(lookupResponse.body.data.items).toHaveLength(1);
    expect(lookupResponse.body.data.items[0].value).toBe('[de] Hello world');
    expect(lookupResponse.body.data.missing).toHaveLength(0);

    const translationId = lookupResponse.body.data.items[0].id as string;

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/translations/${translationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.data.key).toBe('greeting.hello');

    await request(app.getHttpServer())
      .post(
        `/api/v1/projects/${projectId}/translations/${translationId}/quality`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 0.95, referenceValue: '[de] Hello world' })
      .expect(201);

    const qualitySummary = await request(app.getHttpServer())
      .get(`/api/v1/analytics/quality/summary?projectId=${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(qualitySummary.body.data.totalSamples).toBeGreaterThanOrEqual(2);
    expect(qualitySummary.body.data.verifiedSamples).toBeGreaterThanOrEqual(1);
  });
});
