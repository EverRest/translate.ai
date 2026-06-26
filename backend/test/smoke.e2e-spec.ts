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

describe('Smoke (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('GET /metrics', () => {
    return request(app.getHttpServer())
      .get('/metrics')
      .expect(200)
      .expect('content-type', /text\/plain/);
  });

  it('POST /api/v1/auth/register', async () => {
    const suffix = Date.now();
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        tenantName: `Smoke Org ${suffix}`,
        email: `smoke-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    expect(response.body.data.accessToken).toBeDefined();
    token = response.body.data.accessToken as string;
  });

  it('GET /api/v1/auth/me', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.email).toMatch(/^smoke-/);
  });

  it('GET /api/v1/projects', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body.data.items)).toBe(true);
  });

  it('POST /api/v1/projects creates a project', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Smoke Project ${Date.now()}` })
      .expect(201);

    expect(response.body.data.id).toBeDefined();
  });
});
