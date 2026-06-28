import { ConfigService } from '@nestjs/config';
import { SemanticMemoryService } from './semantic-memory.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

describe('SemanticMemoryService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    translationMemory: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;
  const config = {
    get: jest.fn().mockReturnValue(0.92),
  } as unknown as ConfigService;

  let service: SemanticMemoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SemanticMemoryService(prisma, config);
  });

  it('returns null when best match is below threshold', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      {
        id: 'mem-1',
        translated_text: 'Anmelden',
        distance: 0.2,
      },
    ]);

    const match = await service.findSimilar(
      'tenant-1',
      'en',
      'de',
      Array.from({ length: 768 }, () => 0.01),
    );

    expect(match).toBeNull();
  });

  it('returns match when similarity meets threshold', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      {
        id: 'mem-1',
        translated_text: 'Anmelden',
        distance: 0.05,
      },
    ]);

    const match = await service.findSimilar(
      'tenant-1',
      'en',
      'de',
      Array.from({ length: 768 }, () => 0.01),
    );

    expect(match).toEqual({
      memoryId: 'mem-1',
      translatedText: 'Anmelden',
      similarity: 0.95,
    });
  });
});
