import ExcelJS from 'exceljs';
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

function cellValueString(value: ExcelJS.CellValue | null | undefined): string {
  if (value == null) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  return '';
}

async function buildWizClassicFixture(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Export');
  sheet.addRow(['Field ID', 'Scope', 'Key', 'EN', 'FR', 'ES']);
  sheet.addRow(['2001', 'Auth', 'auth.welcome', 'Welcome', '', '']);
  sheet.addRow(['2002', 'Auth', 'auth.logout', 'Log out', 'Déconnexion', '']);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

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

async function waitForExcelSession(
  app: INestApplication<App>,
  token: string,
  projectId: string,
  sessionId: string,
  targetStatus: string,
  timeoutMs = 30_000,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/import/excel/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const status = response.body.data.status as string;
    if (status === targetStatus) {
      return response.body.data;
    }
    if (status === 'failed') {
      throw new Error(
        `Excel session failed: ${response.body.data.errorMessage ?? 'unknown'}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Session ${sessionId} did not reach ${targetStatus}`);
}

describe('Excel delta import (e2e)', () => {
  jest.setTimeout(90_000);

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
    await workerContext?.close();
    await app.close();
  });

  it('registers tenant', async () => {
    const suffix = Date.now();
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        tenantName: `Excel Org ${suffix}`,
        email: `excel-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    token = response.body.data.accessToken as string;
  });

  it('creates project', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Excel E2E ${Date.now()}` })
      .expect(201);

    projectId = response.body.data.id as string;
  });

  it('previews empty cells from Wiz Classic export', async () => {
    const xlsx = await buildWizClassicFixture();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/import/excel/preview`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', xlsx, 'wiz-export.xlsx')
      .expect(201);

    const sessionId = response.body.data.id as string;
    expect(sessionId).toBeTruthy();
    expect(response.body.data.status).toBe('preview_ready');
    expect(response.body.data.stats.emptyCellsByLang.fr).toBe(1);
    expect(response.body.data.stats.emptyCellsByLang.es).toBe(2);
    expect(response.body.data.stats.validRows).toBe(2);
  });

  it('round-trips: delta translate → download preserves layout and Field IDs', async () => {
    const xlsx = await buildWizClassicFixture();

    const previewResponse = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/import/excel/preview`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', xlsx, 'roundtrip.xlsx')
      .expect(201);

    const sessionId = previewResponse.body.data.id as string;

    const translateResponse = await request(app.getHttpServer())
      .post(
        `/api/v1/projects/${projectId}/import/excel/${sessionId}/delta-translate`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ languages: ['fr', 'es'] })
      .expect(201);

    expect(translateResponse.body.data.jobId).toBeTruthy();

    await waitForExcelSession(
      app,
      token,
      projectId,
      sessionId,
      'download_ready',
    );

    const downloadResponse = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}/import/excel/${sessionId}/download`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(downloadResponse.headers['content-type']).toContain('spreadsheetml');

    const outputBuffer = downloadResponse.body as Buffer;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(outputBuffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];

    expect(sheet.getRow(1).getCell(1).value).toBe('Field ID');
    expect(sheet.getRow(2).getCell(1).value).toBe('2001');
    expect(sheet.getRow(3).getCell(1).value).toBe('2002');

    const frWelcome = cellValueString(sheet.getRow(2).getCell(5).value);
    expect(frWelcome.length).toBeGreaterThan(0);

    const esLogout = cellValueString(sheet.getRow(3).getCell(6).value);
    expect(esLogout.length).toBeGreaterThan(0);

    const frLogout = cellValueString(sheet.getRow(3).getCell(5).value);
    expect(frLogout).toBe('Déconnexion');
  });
});
