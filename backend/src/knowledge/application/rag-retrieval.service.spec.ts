import { ConfigService } from '@nestjs/config';
import { RagRetrievalService } from './rag-retrieval.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('RagRetrievalService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  } as unknown as PrismaService;
  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'PROJECT_RAG_ENABLED') {
        return true;
      }
      if (key === 'PROJECT_RAG_TOP_K') {
        return 3;
      }
      if (key === 'PROJECT_RAG_MIN_SIMILARITY') {
        return 0.75;
      }
      if (key === 'PROJECT_RAG_MAX_CHARS') {
        return 1500;
      }
      return defaultValue;
    }),
  } as unknown as ConfigService;

  let service: RagRetrievalService;

  beforeEach(() => {
    jest.clearAllMocks();
    (config.get as jest.Mock).mockImplementation(
      (key: string, defaultValue?: unknown) => {
        if (key === 'PROJECT_RAG_ENABLED') {
          return true;
        }
        if (key === 'PROJECT_RAG_TOP_K') {
          return 3;
        }
        if (key === 'PROJECT_RAG_MIN_SIMILARITY') {
          return 0.75;
        }
        if (key === 'PROJECT_RAG_MAX_CHARS') {
          return 1500;
        }
        return defaultValue;
      },
    );
    service = new RagRetrievalService(prisma, config);
  });

  it('returns empty list when RAG is disabled', async () => {
    (config.get as jest.Mock).mockImplementation(
      (key: string, defaultValue?: unknown) => {
        if (key === 'PROJECT_RAG_ENABLED') {
          return false;
        }
        return defaultValue;
      },
    );

    const result = await service.retrieve(
      'project-1',
      Array.from({ length: 768 }, () => 0.01),
    );

    expect(result).toEqual([]);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('filters rows below similarity threshold', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      {
        content: 'Use friendly tone.',
        source_name: 'Brand guide',
        distance: 0.4,
      },
    ]);

    const result = await service.retrieve(
      'project-1',
      Array.from({ length: 768 }, () => 0.01),
    );

    expect(result).toEqual([]);
  });

  it('returns ranked snippets above threshold', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      {
        content: 'Use friendly tone.',
        source_name: 'Brand guide',
        distance: 0.05,
      },
    ]);

    const result = await service.retrieve(
      'project-1',
      Array.from({ length: 768 }, () => 0.01),
    );

    expect(result).toEqual([
      {
        content: 'Use friendly tone.',
        sourceName: 'Brand guide',
        similarity: 0.95,
      },
    ]);
  });
});
