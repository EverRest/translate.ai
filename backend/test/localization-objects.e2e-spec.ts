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

describe('Localization objects (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let projectId: string;
  let objectId: string;

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
        tenantName: `Objects Org ${suffix}`,
        email: `objects-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    token = response.body.data.accessToken as string;
  });

  it('lists templates, applies login_form, materializes keys (no AI)', async () => {
    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Objects E2E ${Date.now()}` })
      .expect(201);

    projectId = projectResponse.body.data.id as string;

    const templatesResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/objects/templates`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const templates = templatesResponse.body.data.items as Array<{
      id: string;
    }>;
    expect(templates.some((item) => item.id === 'login_form')).toBe(true);

    const objectResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Login E2E',
        slug: 'login_e2e',
        templateType: 'form',
      })
      .expect(201);

    objectId = objectResponse.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects/${objectId}/apply-template`)
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: 'login_form' })
      .expect(201);

    const treeResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/objects/${objectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(treeResponse.body.data.nodeCount).toBeGreaterThan(5);

    const materializeResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/objects/${objectId}/materialize`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(materializeResponse.body.data.total).toBeGreaterThan(0);

    const keysResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/keys?search=login_e2e`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(keysResponse.body.data.meta.total).toBeGreaterThan(0);
    expect(keysResponse.body.data.items[0].key).toMatch(/^login_e2e\./);

    const filteredKeysResponse = await request(app.getHttpServer())
      .get(
        `/api/v1/projects/${projectId}/keys?localizationObjectId=${objectId}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(filteredKeysResponse.body.data.meta.total).toBe(
      keysResponse.body.data.meta.total,
    );

    const prefixKeysResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/keys?keyPrefix=login_e2e.`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(prefixKeysResponse.body.data.meta.total).toBeGreaterThan(0);
  });

  it('prunes orphan keys when materialize prune=true', async () => {
    const treeResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/objects/${objectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const leafNode = findFirstLeaf(treeResponse.body.data.tree);
    expect(leafNode).toBeTruthy();

    await request(app.getHttpServer())
      .delete(
        `/api/v1/projects/${projectId}/objects/${objectId}/nodes/${leafNode!.id}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const pruneResponse = await request(app.getHttpServer())
      .post(
        `/api/v1/projects/${projectId}/objects/${objectId}/materialize?prune=true`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(pruneResponse.body.data.pruned).toBeGreaterThanOrEqual(1);
  });
});

function findFirstLeaf(
  nodes: Array<{ id: string; sourceText: string | null; children?: unknown[] }>,
): { id: string } | null {
  for (const node of nodes) {
    if (node.sourceText !== null && node.sourceText !== undefined) {
      return node;
    }
    const childNodes = (node.children ?? []) as typeof nodes;
    const nested = findFirstLeaf(childNodes);
    if (nested) {
      return nested;
    }
  }
  return null;
}
