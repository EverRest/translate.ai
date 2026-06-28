import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingRegistryService } from '../../../ai-provider/application/embedding-registry.service';
import { TranslationEmbedJobPayload } from '../../../shared/constants/job-payloads';
import { SemanticMemoryService } from './semantic-memory.service';

@Injectable()
export class EmbedJobRunnerService {
  private readonly logger = new Logger(EmbedJobRunnerService.name);

  constructor(
    private readonly semanticMemory: SemanticMemoryService,
    private readonly embeddings: EmbeddingRegistryService,
  ) {}

  async run(payload: TranslationEmbedJobPayload): Promise<void> {
    const limit = payload.limit ?? 50;
    const rows = await this.semanticMemory.listMissingEmbeddings(
      payload.tenantId,
      limit,
      payload.memoryId,
    );

    for (const row of rows) {
      try {
        const embedding = await this.embeddings.embed(row.sourceText);
        await this.semanticMemory.attachEmbedding(row.id, embedding);
      } catch (error) {
        this.logger.warn(
          `Failed to embed translation memory ${row.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
