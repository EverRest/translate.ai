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
import { TranslateTextService } from '../src/translation/application/services/translate-text.service';

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
      objectProgress?: { objectsDone: number; objectsTotal: number };
    };

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

describe('Object batch translation (e2e)', () => {
  jest.setTimeout(60_000);

  let app: INestApplication<App>;
  let workerContext: Awaited<
    ReturnType<typeof NestFactory.createApplicationContext>
  >;
  let token: string;
  let projectId: string;
  let objectId: string;

  beforeAll(async () => {
    process.env.MOCK_TRANSLATIONS = 'true';
    TranslateTextService.mockBatchCallCount = 0;
    app = await createTestApp();
    app.get(ConfigService).set('MOCK_TRANSLATIONS', true);
    workerContext = await NestFactory.createApplicationContext(WorkerModule);
    workerContext.get(ConfigService).set('MOCK_TRANSLATIONS', true);
  });

  afterAll(async () => {
    await workerContext.close();
    await app.close();
  });

  it('translates field label+placeholder+error in one batch call', async () => {
    const suffix = Date.now();
    const authResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        tenantName: `Batch Org ${suffix}`,
        email: `batch-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    token = authResponse.body.data.accessToken as string;

    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Batch Project ${suffix}` })
      .expect(201);

    projectId = projectResponse.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/languages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'es' })
      .expect(201);

    const objectResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Signup Field',
        slug: 'signup_field',
        templateType: 'form',
      })
      .expect(201);

    objectId = objectResponse.body.data.id as string;

    const fieldsNode = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects/${objectId}/nodes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: 'fields', nodeType: 'section' })
      .expect(201);

    const fieldNode = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects/${objectId}/nodes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug: 'email',
        nodeType: 'field',
        parentId: fieldsNode.body.data.id,
      })
      .expect(201);

    const fieldId = fieldNode.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects/${objectId}/nodes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug: 'label',
        nodeType: 'label',
        parentId: fieldId,
        sourceText: 'Email',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects/${objectId}/nodes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug: 'placeholder',
        nodeType: 'placeholder',
        parentId: fieldId,
        sourceText: 'Enter your email',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects/${objectId}/nodes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug: 'required',
        nodeType: 'error',
        parentId: fieldId,
        sourceText: 'Email is required',
      })
      .expect(201);

    const jobResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects/translate-batch`)
      .set('Authorization', `Bearer ${token}`)
      .send({ objectIds: [objectId], languages: ['es'] })
      .expect(201);

    const jobId = jobResponse.body.data.jobId as string;
    const completedJob = await waitForJob(app, token, jobId);

    expect(completedJob.objectProgress).toEqual({
      objectsDone: 1,
      objectsTotal: 1,
    });
    expect(TranslateTextService.mockBatchCallCount).toBe(1);

    const translationsResponse = await request(app.getHttpServer())
      .get(
        `/api/v1/projects/${projectId}/translations?localizationObjectId=${objectId}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const translations = translationsResponse.body.data.items as Array<{
      language: string;
      value: string;
    }>;

    expect(translations.filter((row) => row.language === 'es')).toHaveLength(3);
    expect(translations.every((row) => row.value.startsWith('[es]'))).toBe(
      true,
    );
  });
});
