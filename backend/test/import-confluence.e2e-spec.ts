import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const fixturesDir = join(__dirname, 'fixtures/confluence');

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

describe('Confluence import (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let projectId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers tenant', async () => {
    const suffix = Date.now();
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        tenantName: `Import Org ${suffix}`,
        email: `import-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    token = response.body.data.accessToken as string;
  });

  it('creates project', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Import E2E ${Date.now()}` })
      .expect(201);

    projectId = response.body.data.id as string;
  });

  it('imports sample CSV and previews diff', async () => {
    const csv = readFileSync(join(fixturesDir, 'sample.csv'));

    const createResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/import/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', csv, 'sample.csv')
      .expect(201);

    const sessionId = createResponse.body.data.id as string;
    expect(createResponse.body.data.status).toBe('preview_ready');
    expect(createResponse.body.data.diffSummary.create).toBe(3);

    const previewResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/import/sessions/${sessionId}/preview`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(previewResponse.body.data.items).toHaveLength(3);
    expect(previewResponse.body.data.items[0].action).toBe('create');
  });

  it('applies import and creates keys with hints in context', async () => {
    const csv = readFileSync(join(fixturesDir, 'sample.csv'));

    const createResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/import/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', csv, 'apply.csv')
      .expect(201);

    const sessionId = createResponse.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/import/sessions/${sessionId}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ conflictStrategy: 'update' })
      .expect(201);

    const keysResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/keys?search=login.submit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const items = keysResponse.body.data.items as Array<{
      key: string;
      context: string | null;
    }>;
    const key = items.find((item) => item.key === 'login.submit');
    expect(key).toBeDefined();
    expect(key.context).toContain('hints:');
    expect(key.context).toContain('strictPlaceholders: true');
  });

  it('imports pasted HTML', async () => {
    const html = readFileSync(join(fixturesDir, 'sample.html'), 'utf8');

    const createResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/import/sessions/paste`)
      .set('Authorization', `Bearer ${token}`)
      .send({ html })
      .expect(201);

    expect(createResponse.body.data.status).toBe('preview_ready');
    expect(createResponse.body.data.diffSummary.create).toBeGreaterThanOrEqual(
      0,
    );
  });

  it('imports large-demo CSV with 850 keys under 30s', async () => {
    const csv = readFileSync(join(fixturesDir, 'large-demo.csv'));
    const started = Date.now();

    const createResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/import/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', csv, 'large-demo.csv')
      .expect(201);

    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(30_000);
    expect(createResponse.body.data.diffSummary.create).toBe(850);

    const sessionId = createResponse.body.data.id as string;
    const applyStarted = Date.now();

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/import/sessions/${sessionId}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ conflictStrategy: 'update' })
      .expect(201);

    expect(Date.now() - applyStarted).toBeLessThan(30_000);

    const keysResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/keys?limit=1`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(keysResponse.body.data.meta.total).toBeGreaterThanOrEqual(850);
  }, 60_000);
});
