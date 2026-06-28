import { Module } from '@nestjs/common';
import { ContentClassifierService } from './application/content-classifier.service';
import { EmbeddingRegistryService } from './application/embedding-registry.service';
import { OllamaModelRouterService } from './application/ollama-model-router.service';
import { ProviderRegistryService } from './application/provider-registry.service';
import { GeminiProvider } from './infrastructure/gemini.provider';
import { OllamaClient } from './infrastructure/ollama.client';
import { OllamaEmbeddingProvider } from './infrastructure/ollama-embedding.provider';
import { OllamaPolishService } from './infrastructure/ollama-polish.service';
import { OllamaProvider } from './infrastructure/ollama.provider';
import { OpenAiEmbeddingProvider } from './infrastructure/openai-embedding.provider';
import { OpenAiProvider } from './infrastructure/openai.provider';

@Module({
  providers: [
    OpenAiProvider,
    OpenAiEmbeddingProvider,
    GeminiProvider,
    OllamaClient,
    OllamaEmbeddingProvider,
    OllamaModelRouterService,
    ContentClassifierService,
    OllamaPolishService,
    OllamaProvider,
    ProviderRegistryService,
    EmbeddingRegistryService,
  ],
  exports: [ProviderRegistryService, EmbeddingRegistryService],
})
export class AiProviderModule {}
