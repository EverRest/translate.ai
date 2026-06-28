import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  formatPgVector,
  meetsSimilarityThreshold,
  similarityFromCosineDistance,
} from './embedding-vector.utils';

export interface KnowledgeSnippet {
  content: string;
  sourceName: string;
  similarity: number;
}

@Injectable()
export class RagRetrievalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async retrieve(
    projectId: string,
    queryEmbedding: number[],
  ): Promise<KnowledgeSnippet[]> {
    if (!this.config.get<boolean>('PROJECT_RAG_ENABLED', true)) {
      return [];
    }

    const topK = this.config.get<number>('PROJECT_RAG_TOP_K', 3);
    const minSimilarity = this.config.get<number>(
      'PROJECT_RAG_MIN_SIMILARITY',
      0.75,
    );
    const maxChars = this.config.get<number>('PROJECT_RAG_MAX_CHARS', 1500);
    const vector = formatPgVector(queryEmbedding);

    const rows = await this.prisma.$queryRaw<
      Array<{
        content: string;
        source_name: string;
        distance: number;
      }>
    >(Prisma.sql`
      SELECT
        c.content,
        s.name AS source_name,
        (c.embedding <=> ${vector}::vector) AS distance
      FROM project_knowledge_chunks c
      INNER JOIN project_knowledge_sources s ON s.id = c.source_id
      WHERE c.project_id = ${projectId}::uuid
        AND s.status = 'ready'
        AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${vector}::vector
      LIMIT ${topK}
    `);

    const snippets: KnowledgeSnippet[] = [];
    let usedChars = 0;

    for (const row of rows) {
      const similarity = similarityFromCosineDistance(Number(row.distance));
      if (!meetsSimilarityThreshold(similarity, minSimilarity)) {
        continue;
      }

      if (usedChars + row.content.length > maxChars) {
        break;
      }

      snippets.push({
        content: row.content,
        sourceName: row.source_name,
        similarity,
      });
      usedChars += row.content.length;
    }

    return snippets;
  }
}
