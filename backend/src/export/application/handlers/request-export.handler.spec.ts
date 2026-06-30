import { ConfigService } from '@nestjs/config';
import { ExportJobStatus, TranslationStatus } from '@prisma/client';
import { RequestExportHandler } from './request-export.handler';

describe('RequestExportHandler', () => {
  const projectAccess = {
    getProjectForTenant: jest.fn().mockResolvedValue({ id: 'project-1' }),
  };
  const exportData = {
    countTranslations: jest.fn(),
  };
  const exportQueue = {
    enqueueExport: jest.fn().mockResolvedValue(undefined),
  };
  const exportJobRunner = {
    run: jest.fn().mockResolvedValue(undefined),
  };
  const config = {
    get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
  };

  const prisma = {
    exportJob: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };

  let handler: RequestExportHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new RequestExportHandler(
      prisma as never,
      projectAccess as never,
      exportData as never,
      exportQueue as never,
      exportJobRunner as never,
      config as unknown as ConfigService,
    );
  });

  it('enqueues async export when row count exceeds threshold', async () => {
    exportData.countTranslations.mockResolvedValue(1001);
    prisma.exportJob.create.mockResolvedValue({
      id: 'export-1',
      projectId: 'project-1',
      format: 'json',
      language: null,
      statusFilter: TranslationStatus.published,
      exportStatus: ExportJobStatus.pending,
      rowCount: 1001,
      filename: null,
      contentType: null,
      errorMessage: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: null,
    });

    const result = await handler.execute({
      tenantId: 'tenant-1',
      projectId: 'project-1',
      format: 'json',
      language: undefined,
      status: undefined,
    } as never);

    expect(exportQueue.enqueueExport).toHaveBeenCalledWith({
      exportJobId: 'export-1',
      tenantId: 'tenant-1',
    });
    expect(exportJobRunner.run).not.toHaveBeenCalled();
    expect(result.async).toBe(true);
    expect(result.exportStatus).toBe(ExportJobStatus.pending);
  });

  it('runs inline export when row count is within threshold', async () => {
    exportData.countTranslations.mockResolvedValue(10);
    prisma.exportJob.create.mockResolvedValue({
      id: 'export-2',
      projectId: 'project-1',
      format: 'po',
      language: 'de',
      statusFilter: TranslationStatus.published,
      exportStatus: ExportJobStatus.processing,
      rowCount: 10,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    prisma.exportJob.findUniqueOrThrow.mockResolvedValue({
      id: 'export-2',
      projectId: 'project-1',
      format: 'po',
      language: 'de',
      statusFilter: TranslationStatus.published,
      exportStatus: ExportJobStatus.completed,
      rowCount: 10,
      filename: 'de.po',
      contentType: 'text/plain',
      errorMessage: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: new Date('2026-01-01T00:00:01.000Z'),
    });

    const result = await handler.execute({
      tenantId: 'tenant-1',
      projectId: 'project-1',
      format: 'po',
      language: 'de',
      status: 'published',
    } as never);

    expect(exportQueue.enqueueExport).not.toHaveBeenCalled();
    expect(exportJobRunner.run).toHaveBeenCalledWith('export-2');
    expect(result.async).toBe(false);
    expect(result.downloadUrl).toBe('/exports/export-2/download');
  });
});
