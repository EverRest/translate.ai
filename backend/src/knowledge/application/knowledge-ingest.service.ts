import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KnowledgeSourceStatus, Prisma } from '@prisma/client';
import { EmbeddingRegistryService } from '../../ai-provider/application/embedding-registry.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { formatPgVector } from './embedding-vector.utils';
import { chunkText } from './text-chunker.utils';

@Injectable()
export class KnowledgeIngestService {
  private readonly logger = new Logger(KnowledgeIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingRegistryService,
    private readonly config: ConfigService,
  ) {}

  async run(sourceId: string): Promise<number> {
    const source = await this.prisma.projectKnowledgeSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      this.logger.warn(`Knowledge source ${sourceId} not found`);
      return 0;
    }

    try {
      const chunkSize = this.config.get<number>('KNOWLEDGE_CHUNK_SIZE', 250);
      const overlap = this.config.get<number>('KNOWLEDGE_CHUNK_OVERLAP', 50);
      const chunks = chunkText(source.rawContent, { chunkSize, overlap });

      await this.prisma.$transaction(async (tx) => {
        await tx.projectKnowledgeChunk.deleteMany({
          where: { sourceId: source.id },
        });

        for (const chunk of chunks) {
          const created = await tx.projectKnowledgeChunk.create({
            data: {
              sourceId: source.id,
              projectId: source.projectId,
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
              charStart: chunk.charStart,
              charEnd: chunk.charEnd,
              tokenEstimate: chunk.tokenEstimate,
              metadata: chunk.metadata as Prisma.InputJsonValue,
            },
          });

          const embedding = await this.embeddings.embed(chunk.content);
          const vector = formatPgVector(embedding);
          await tx.$executeRaw`
            UPDATE project_knowledge_chunks
            SET embedding = ${vector}::vector,
                embedded_at = NOW()
            WHERE id = ${created.id}::uuid
          `;
        }

        await tx.projectKnowledgeSource.update({
          where: { id: source.id },
          data: {
            status: KnowledgeSourceStatus.ready,
            chunkCount: chunks.length,
            errorMessage: null,
          },
        });
      });

      return chunks.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.projectKnowledgeSource.update({
        where: { id: source.id },
        data: {
          status: KnowledgeSourceStatus.failed,
          errorMessage: message,
        },
      });
      throw error;
    }
  }
}
