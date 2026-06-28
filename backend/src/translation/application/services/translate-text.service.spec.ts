import { ConfigService } from '@nestjs/config';
import { MemoryHitType } from '@prisma/client';
import { EmbeddingRegistryService } from '../../../ai-provider/application/embedding-registry.service';
import { ProviderRegistryService } from '../../../ai-provider/application/provider-registry.service';
import { AiUsageService } from '../../../billing/application/ai-usage.service';
import { EmbedQueueService } from '../../infrastructure/embed-queue.service';
import { RagRetrievalService } from '../../../knowledge/application/rag-retrieval.service';
import { MemoryHitService } from './memory-hit.service';
import { SemanticMemoryService } from './semantic-memory.service';
import { TranslateTextService } from './translate-text.service';
import { TranslationMemoryService } from './translation-memory.service';

describe('TranslateTextService', () => {
  const memory = {
    lookup: jest.fn(),
    store: jest.fn(),
  } as unknown as TranslationMemoryService;
  const semanticMemory = {
    findSimilar: jest.fn(),
  } as unknown as SemanticMemoryService;
  const memoryHits = {
    log: jest.fn(),
  } as unknown as MemoryHitService;
  const embeddings = {
    embed: jest.fn(),
  } as unknown as EmbeddingRegistryService;
  const embedQueue = {
    enqueueEmbed: jest.fn(),
  } as unknown as EmbedQueueService;
  const ragRetrieval = {
    retrieve: jest.fn(),
  } as unknown as RagRetrievalService;
  const providers = {
    translateWithFallback: jest.fn(),
  } as unknown as ProviderRegistryService;
  const usage = {
    log: jest.fn(),
  } as unknown as AiUsageService;
  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'SEMANTIC_MEMORY_ENABLED') {
        return true;
      }
      if (key === 'DEFAULT_SOURCE_LANGUAGE') {
        return 'en';
      }
      if (key === 'PROJECT_RAG_ENABLED') {
        return true;
      }
      return defaultValue;
    }),
  } as unknown as ConfigService;

  let service: TranslateTextService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TranslateTextService(
      memory,
      semanticMemory,
      memoryHits,
      embeddings,
      embedQueue,
      ragRetrieval,
      providers,
      usage,
      config,
    );
    (ragRetrieval.retrieve as jest.Mock).mockResolvedValue([]);
  });

  it('returns exact memory hit before embedding or LLM', async () => {
    (memory.lookup as jest.Mock).mockResolvedValue('Anmelden');

    const result = await service.translate({
      tenantId: 'tenant-1',
      projectId: 'project-1',
      text: 'Log in',
      targetLang: 'de',
      providerName: 'gemini',
    });

    expect(result).toEqual({
      text: 'Anmelden',
      provider: 'memory',
      usedFallback: false,
    });
    expect(embeddings.embed).not.toHaveBeenCalled();
    expect(providers.translateWithFallback).not.toHaveBeenCalled();
    expect(memoryHits.log).toHaveBeenCalledWith(
      expect.objectContaining({ hitType: MemoryHitType.exact }),
    );
  });

  it('uses semantic memory when exact lookup misses', async () => {
    (memory.lookup as jest.Mock).mockResolvedValue(null);
    (embeddings.embed as jest.Mock).mockResolvedValue([0.1]);
    (semanticMemory.findSimilar as jest.Mock).mockResolvedValue({
      memoryId: 'mem-1',
      translatedText: 'Anmelden',
      similarity: 0.95,
    });

    const result = await service.translate({
      tenantId: 'tenant-1',
      projectId: 'project-1',
      text: 'Login',
      targetLang: 'de',
      providerName: 'gemini',
    });

    expect(result.text).toBe('Anmelden');
    expect(providers.translateWithFallback).not.toHaveBeenCalled();
    expect(memoryHits.log).toHaveBeenCalledWith(
      expect.objectContaining({ hitType: MemoryHitType.semantic }),
    );
  });

  it('passes knowledge snippets to LLM when RAG returns matches', async () => {
    (memory.lookup as jest.Mock).mockResolvedValue(null);
    (embeddings.embed as jest.Mock).mockResolvedValue([0.1]);
    (semanticMemory.findSimilar as jest.Mock).mockResolvedValue(null);
    (ragRetrieval.retrieve as jest.Mock).mockResolvedValue([
      {
        content: 'Use friendly tone.',
        sourceName: 'Brand guide',
        similarity: 0.91,
      },
    ]);
    (providers.translateWithFallback as jest.Mock).mockResolvedValue({
      text: 'Freundlicher Text',
      provider: 'gemini',
      primaryProvider: 'gemini',
      usedFallback: false,
      usage: {
        model: 'gemini-2.0-flash',
        inputTokens: 10,
        outputTokens: 5,
        estimatedCostUsd: 0,
      },
    });
    (memory.store as jest.Mock).mockResolvedValue('mem-2');

    await service.translate({
      tenantId: 'tenant-1',
      projectId: 'project-1',
      text: 'Welcome back',
      targetLang: 'de',
      providerName: 'gemini',
    });

    expect(providers.translateWithFallback).toHaveBeenCalledWith(
      expect.anything(),
      'Welcome back',
      'en',
      'de',
      expect.objectContaining({
        knowledgeSnippets: [
          expect.objectContaining({
            content: 'Use friendly tone.',
            sourceName: 'Brand guide',
          }),
        ],
      }),
      expect.anything(),
    );
  });
});
