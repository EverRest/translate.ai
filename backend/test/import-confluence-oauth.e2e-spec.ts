import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { WorkerModule } from '../src/worker/worker.module';

const fixturesDir = join(__dirname, 'fixtures/confluence');
const sampleHtml = readFileSync(join(fixturesDir, 'sample.html'), 'utf8');

const CLOUD_ID = 'e2e-cloud-id';
const PAGE_ID = 'e2e-page-1';

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

function installAtlassianFetchMock(): void {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (url.includes('auth.atlassian.com/oauth/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            scope: 'read:confluence-content.all',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('accessible-resources')) {
        return new Response(
          JSON.stringify([
            {
              id: CLOUD_ID,
              name: 'E2E Confluence',
              url: 'https://e2e.atlassian.net',
              scopes: ['read:confluence-content.all'],
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes(`/wiki/api/v2/spaces`)) {
        return new Response(
          JSON.stringify({
            results: [{ id: 'space-1', key: 'TR', name: 'Translations' }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes(`/wiki/api/v2/spaces/space-1/pages`)) {
        return new Response(
          JSON.stringify({
            results: [{ id: PAGE_ID, title: 'Login keys' }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes(`/wiki/api/v2/pages/${PAGE_ID}`)) {
        return new Response(
          JSON.stringify({
            id: PAGE_ID,
            title: 'Login keys',
            body: { storage: { value: sampleHtml } },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return originalFetch(input, init);
    },
  ) as typeof fetch;
}

describe('Confluence OAuth live sync (e2e)', () => {
  jest.setTimeout(90_000);

  let app: INestApplication<App>;
  let workerContext: Awaited<
    ReturnType<typeof NestFactory.createApplicationContext>
  >;
  let token: string;
  let projectId: string;

  beforeAll(async () => {
    installAtlassianFetchMock();
    app = await createTestApp();
    workerContext = await NestFactory.createApplicationContext(WorkerModule);
    workerContext.get(ConfigService).set('MOCK_TRANSLATIONS', true);
  });

  afterAll(async () => {
    await workerContext.close();
    await app.close();
    jest.restoreAllMocks();
  });

  it('registers tenant', async () => {
    const suffix = Date.now();
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        tenantName: `OAuth Org ${suffix}`,
        email: `oauth-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    token = response.body.data.accessToken as string;
  });

  it('creates project', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `OAuth E2E ${Date.now()}` })
      .expect(201);

    projectId = response.body.data.id as string;
  });

  it('reports oauth available', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/integrations/confluence`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.oauthAvailable).toBe(true);
    expect(response.body.data.connected).toBe(false);
  });

  it('simulates OAuth callback and connects', async () => {
    const connectResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/integrations/confluence/connect`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const authorizeUrl = new URL(connectResponse.body.data.url as string);
    const state = authorizeUrl.searchParams.get('state');
    expect(state).toBeTruthy();

    await request(app.getHttpServer())
      .get('/api/v1/integrations/confluence/oauth/callback')
      .query({ code: 'mock-auth-code', state })
      .expect(302);

    const integration = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/integrations/confluence`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(integration.body.data.connected).toBe(true);
    expect(integration.body.data.connection.siteName).toBe('E2E Confluence');
  });

  it('syncs page and produces import preview', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/integrations/confluence/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pageIds: [PAGE_ID] })
      .expect(200);

    const syncResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/integrations/confluence/sync`)
      .set('Authorization', `Bearer ${token}`)
      .send({ autoApply: false })
      .expect(201);

    const sessionId = syncResponse.body.data.sessionId as string;

    const started = Date.now();
    let status = 'pending';
    while (Date.now() - started < 30_000) {
      const sessionResponse = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/import/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      status = sessionResponse.body.data.status as string;
      if (status === 'preview_ready' || status === 'failed') {
        expect(status).toBe('preview_ready');
        expect(sessionResponse.body.data.diffSummary.create).toBe(3);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    throw new Error(
      `Sync session did not reach preview_ready (last: ${status})`,
    );
  });
});
