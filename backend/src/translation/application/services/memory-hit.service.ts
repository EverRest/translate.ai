import { Injectable } from '@nestjs/common';
import { MemoryHitType } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { MetricsService } from '../../../shared/monitoring/metrics.service';

export interface MemoryHitLogInput {
  tenantId: string;
  projectId?: string;
  jobId?: string;
  jobItemId?: string;
  hitType: MemoryHitType;
  sourceLang: string;
  targetLang: string;
  similarity?: number;
}

@Injectable()
export class MemoryHitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  async log(input: MemoryHitLogInput): Promise<void> {
    await this.prisma.translationMemoryHit.create({
      data: {
        tenantId: input.tenantId,
        projectId: input.projectId,
        jobId: input.jobId,
        jobItemId: input.jobItemId,
        hitType: input.hitType,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        similarity: input.similarity,
      },
    });

    this.metrics.recordMemoryHit(input.hitType);
  }
}
