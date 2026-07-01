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

describe('Coverage matrix (e2e)', () => {
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

  it('returns scope × language matrix and filters keys by scope', async () => {
    const suffix = Date.now();
    const authResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        tenantName: `Coverage Org ${suffix}`,
        email: `coverage-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    token = authResponse.body.data.accessToken as string;

    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Coverage Project ${suffix}` })
      .expect(201);

    projectId = projectResponse.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/keys`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: 'forms.submit',
        sourceText: 'Submit',
        context: 'scope: Forms',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/keys`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: 'login.title',
        sourceText: 'Sign in',
        context: 'scope: BMA/Login',
      })
      .expect(201);

    const jobResponse = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId,
        languages: ['fr'],
        keys: ['forms.submit', 'login.title'],
      })
      .expect(201);

    await waitForJob(app, token, jobResponse.body.data.jobId as string);

    const matrixResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/reports/coverage-matrix`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const matrix = matrixResponse.body.data as {
      scopes: string[];
      languages: string[];
      cells: Array<{
        scope: string;
        language: string;
        total: number;
        translated: number;
        rag: string;
      }>;
      worstCells: Array<{ scope: string; language: string }>;
    };

    expect(matrix.scopes).toEqual(
      expect.arrayContaining(['Forms', 'BMA/Login']),
    );
    expect(matrix.languages).toContain('fr');

    const formsFr = matrix.cells.find(
      (cell) => cell.scope === 'Forms' && cell.language === 'fr',
    );
    expect(formsFr).toMatchObject({ total: 1, translated: 1 });
    expect(['red', 'yellow', 'green']).toContain(formsFr?.rag);

    expect(matrix.worstCells.length).toBeGreaterThan(0);

    const scopedKeysResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/keys`)
      .query({ scope: 'Forms' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const scopedKeys = scopedKeysResponse.body.data.items as Array<{
      key: string;
    }>;
    expect(scopedKeys.map((item) => item.key)).toEqual(['forms.submit']);
  });
});
