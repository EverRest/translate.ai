import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  formatPgVector,
  meetsSimilarityThreshold,
  similarityFromCosineDistance,
} from '../utils/embedding.utils';

export interface SemanticMemoryMatch {
  memoryId: string;
  translatedText: string;
  similarity: number;
}

@Injectable()
export class SemanticMemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findSimilar(
    tenantId: string,
    sourceLang: string,
    targetLang: string,
    queryEmbedding: number[],
  ): Promise<SemanticMemoryMatch | null> {
    const threshold = this.config.get<number>(
      'SEMANTIC_MEMORY_THRESHOLD',
      0.92,
    );
    const vector = formatPgVector(queryEmbedding);

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        translated_text: string;
        distance: number;
      }>
    >(Prisma.sql`
      SELECT
        id,
        translated_text,
        (embedding <=> ${vector}::vector) AS distance
      FROM translation_memory
      WHERE tenant_id = ${tenantId}::uuid
        AND source_language = ${sourceLang}
        AND target_language = ${targetLang}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vector}::vector
      LIMIT 1
    `);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const similarity = similarityFromCosineDistance(Number(row.distance));
    if (!meetsSimilarityThreshold(similarity, threshold)) {
      return null;
    }

    return {
      memoryId: row.id,
      translatedText: row.translated_text,
      similarity,
    };
  }

  async attachEmbedding(memoryId: string, embedding: number[]): Promise<void> {
    const vector = formatPgVector(embedding);
    await this.prisma.$executeRaw`
      UPDATE translation_memory
      SET embedding = ${vector}::vector,
          embedded_at = NOW()
      WHERE id = ${memoryId}::uuid
    `;
  }

  async listMissingEmbeddings(
    tenantId: string,
    limit: number,
    memoryId?: string,
  ): Promise<Array<{ id: string; sourceText: string }>> {
    if (memoryId) {
      const rows = await this.prisma.translationMemory.findMany({
        where: { id: memoryId, tenantId, embeddedAt: null },
        select: { id: true, sourceText: true },
        take: 1,
      });
      return rows;
    }

    return this.prisma.translationMemory.findMany({
      where: { tenantId, embeddedAt: null },
      select: { id: true, sourceText: true },
      take: limit,
      orderBy: { id: 'asc' },
    });
  }
}
