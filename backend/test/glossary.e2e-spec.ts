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

describe('Glossary (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let projectId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers tenant and creates project', async () => {
    const suffix = Date.now();
    const authResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        tenantName: `Glossary Org ${suffix}`,
        email: `glossary-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    token = authResponse.body.data.accessToken as string;

    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Glossary E2E ${suffix}` })
      .expect(201);

    projectId = projectResponse.body.data.id as string;
  });

  it('PUT upsert creates a new term', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/glossary/terms/upsert`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceTerm: 'Title',
        targetTerm: 'Заголовок',
      })
      .expect(200);

    expect(response.body.data.created).toBe(true);
    expect(response.body.data.term.sourceTerm).toBe('Title');
    expect(response.body.data.term.targetTerm).toBe('Заголовок');
  });

  it('PUT upsert updates the same sourceTerm', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/v1/projects/${projectId}/glossary/terms/upsert`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceTerm: 'Title',
        targetTerm: 'Название',
        note: 'preferred',
      })
      .expect(200);

    expect(response.body.data.created).toBe(false);
    expect(response.body.data.term.targetTerm).toBe('Название');
    expect(response.body.data.term.note).toBe('preferred');
  });

  it('POST bulk-upsert merges multiple terms', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/glossary/terms/bulk-upsert`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        terms: [
          { sourceTerm: 'Title', targetTerm: 'Заголовок' },
          { sourceTerm: 'Label', targetTerm: 'Метка' },
          { sourceTerm: 'API', doNotTranslate: true },
        ],
      })
      .expect(201);

    expect(response.body.data.total).toBe(3);
    expect(response.body.data.created).toBe(2);
    expect(response.body.data.updated).toBe(1);
  });

  it('GET lists upserted terms', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/glossary/terms`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const items = response.body.data.items as Array<{ sourceTerm: string }>;
    expect(items.some((item) => item.sourceTerm === 'Label')).toBe(true);
    expect(items.some((item) => item.sourceTerm === 'API')).toBe(true);
  });

  it('GET glossaries lists Default as active', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/glossaries`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const items = response.body.data.items as Array<{
      name: string;
      isActive: boolean;
      termCount: number;
    }>;
    expect(items.some((item) => item.name === 'Default' && item.isActive)).toBe(
      true,
    );
    expect(items.find((item) => item.name === 'Default')?.termCount).toBeGreaterThan(
      0,
    );
  });

  it('POST creates and activates a new glossary set', async () => {
    const createResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/glossaries`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Legal', cloneFromActive: true })
      .expect(201);

    const glossaryId = createResponse.body.data.id as string;
    expect(createResponse.body.data.name).toBe('Legal');
    expect(createResponse.body.data.isActive).toBe(false);

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/glossaries/${glossaryId}/activate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/glossaries`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const items = listResponse.body.data.items as Array<{
      id: string;
      isActive: boolean;
    }>;
    expect(items.find((item) => item.id === glossaryId)?.isActive).toBe(true);
  });
});
