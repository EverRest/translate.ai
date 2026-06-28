import { MemoryHitType } from '@prisma/client';
import { MemoryAnalyticsService } from './memory-analytics.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('MemoryAnalyticsService', () => {
  const prisma = {
    translationMemoryHit: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    aiUsageLog: {
      count: jest.fn(),
    },
  } as unknown as PrismaService;

  let service: MemoryAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MemoryAnalyticsService(prisma);
  });

  it('aggregates exact, semantic, and llm counts', async () => {
    (prisma.translationMemoryHit.count as jest.Mock)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5);
    (prisma.aiUsageLog.count as jest.Mock).mockResolvedValue(15);
    (prisma.translationMemoryHit.findMany as jest.Mock).mockResolvedValue([
      { hitType: MemoryHitType.exact, createdAt: new Date('2026-06-01') },
      { hitType: MemoryHitType.semantic, createdAt: new Date('2026-06-01') },
    ]);

    const summary = await service.getSummary({
      tenantId: 'tenant-1',
    });

    expect(summary.memoryHitExact).toBe(10);
    expect(summary.memoryHitSemantic).toBe(5);
    expect(summary.llmCalls).toBe(15);
    expect(summary.totalHits).toBe(30);
    expect(summary.combinedHitRate).toBeCloseTo(0.5);
    expect(summary.timeline).toEqual([
      { date: '2026-06-01', exact: 1, semantic: 1 },
    ]);
  });
});
