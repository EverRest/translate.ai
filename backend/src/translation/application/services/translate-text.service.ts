import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemoryHitType } from '@prisma/client';
import { TranslateOptions } from '../../../ai-provider/domain/ai-provider.interface';
import { TranslateContext } from '../../../ai-provider/domain/ai-provider.types';
import { EmbeddingRegistryService } from '../../../ai-provider/application/embedding-registry.service';
import { ProviderRegistryService } from '../../../ai-provider/application/provider-registry.service';
import { resolveJobAiProvider } from '../../../ai-provider/domain/ai-provider.utils';
import { AiUsageService } from '../../../billing/application/ai-usage.service';
import { sanitizeTranslationOutput } from '../../../shared/utils/translation-sanitize.utils';
import { EmbedQueueService } from '../../infrastructure/embed-queue.service';
import { MemoryHitService } from './memory-hit.service';
import { SemanticMemoryService } from './semantic-memory.service';
import { TranslationMemoryService } from './translation-memory.service';

export interface TranslateResult {
  text: string;
  provider: string;
  usedFallback: boolean;
}

export interface TranslateRequest extends TranslateContext {
  text: string;
  targetLang: string;
  providerName: string;
  options?: TranslateOptions;
  sourceLang?: string;
  skipMemory?: boolean;
}

@Injectable()
export class TranslateTextService {
  private readonly logger = new Logger(TranslateTextService.name);

  constructor(
    private readonly memory: TranslationMemoryService,
    private readonly semanticMemory: SemanticMemoryService,
    private readonly memoryHits: MemoryHitService,
    private readonly embeddings: EmbeddingRegistryService,
    private readonly embedQueue: EmbedQueueService,
    private readonly providers: ProviderRegistryService,
    private readonly usage: AiUsageService,
    private readonly config: ConfigService,
  ) {}

  async translate(request: TranslateRequest): Promise<TranslateResult> {
    if (this.config.get<boolean>('MOCK_TRANSLATIONS')) {
      return {
        text: `[${request.targetLang}] ${request.text}`,
        provider: 'mock',
        usedFallback: false,
      };
    }

    const source =
      request.sourceLang ??
      this.config.get<string>('DEFAULT_SOURCE_LANGUAGE', 'en');

    let queryEmbedding: number[] | undefined;

    if (!request.skipMemory) {
      const cached = await this.memory.lookup(
        request.tenantId,
        request.text,
        source,
        request.targetLang,
      );
      if (cached) {
        await this.logHit(request, MemoryHitType.exact, source);
        return { text: cached, provider: 'memory', usedFallback: false };
      }

      if (this.config.get<boolean>('SEMANTIC_MEMORY_ENABLED', true)) {
        queryEmbedding = await this.tryEmbed(request.text);
        if (queryEmbedding) {
          const match = await this.semanticMemory.findSimilar(
            request.tenantId,
            source,
            request.targetLang,
            queryEmbedding,
          );
          if (match) {
            await this.logHit(
              request,
              MemoryHitType.semantic,
              source,
              match.similarity,
            );
            return {
              text: match.translatedText,
              provider: 'memory',
              usedFallback: false,
            };
          }
        }
      }
    }

    const result = await this.providers.translateWithFallback(
      resolveJobAiProvider(request.providerName),
      request.text,
      source,
      request.targetLang,
      request.options,
      {
        tenantId: request.tenantId,
        projectId: request.projectId,
        jobId: request.jobId,
        jobItemId: request.jobItemId,
      },
    );

    const translatedText = sanitizeTranslationOutput(result.text, request.text);

    const memoryId = await this.memory.store({
      tenantId: request.tenantId,
      sourceText: request.text,
      sourceLang: source,
      targetLang: request.targetLang,
      translatedText,
      embedding: queryEmbedding,
    });

    if (!queryEmbedding) {
      await this.enqueueEmbeddingBackfill(request.tenantId, memoryId);
    }

    await this.usage.log({
      tenantId: request.tenantId,
      userId: request.userId,
      projectId: request.projectId,
      jobId: request.jobId,
      jobItemId: request.jobItemId,
      provider: result.provider,
      primaryProvider: result.primaryProvider,
      usedFallback: result.usedFallback,
      usage: result.usage,
    });

    return {
      text: translatedText,
      provider: result.provider,
      usedFallback: result.usedFallback,
    };
  }

  private async tryEmbed(text: string): Promise<number[] | undefined> {
    try {
      return await this.embeddings.embed(text);
    } catch (error) {
      this.logger.warn(
        `Embedding failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  private async logHit(
    request: TranslateRequest,
    hitType: MemoryHitType,
    source: string,
    similarity?: number,
  ): Promise<void> {
    await this.memoryHits.log({
      tenantId: request.tenantId,
      projectId: request.projectId,
      jobId: request.jobId,
      jobItemId: request.jobItemId,
      hitType,
      sourceLang: source,
      targetLang: request.targetLang,
      similarity,
    });
  }

  private async enqueueEmbeddingBackfill(
    tenantId: string,
    memoryId: string,
  ): Promise<void> {
    try {
      await this.embedQueue.enqueueEmbed({ tenantId, memoryId });
    } catch (error) {
      this.logger.warn(
        `Failed to enqueue embedding backfill for ${memoryId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
