import { Module } from '@nestjs/common';
import { AiConfigService } from './application/ai-config.service';
import { ContentClassifierService } from './application/content-classifier.service';
import { OllamaModelRouterService } from './application/ollama-model-router.service';
import { ProviderRegistryService } from './application/provider-registry.service';
import { GeminiProvider } from './infrastructure/gemini.provider';
import { OllamaClient } from './infrastructure/ollama.client';
import { OllamaPolishService } from './infrastructure/ollama-polish.service';
import { OllamaProvider } from './infrastructure/ollama.provider';
import { OpenAiProvider } from './infrastructure/openai.provider';
import { AiConfigController } from './presentation/ai-config.controller';

@Module({
  controllers: [AiConfigController],
  providers: [
    AiConfigService,
    OpenAiProvider,
    GeminiProvider,
    OllamaClient,
    OllamaModelRouterService,
    ContentClassifierService,
    OllamaPolishService,
    OllamaProvider,
    ProviderRegistryService,
  ],
  exports: [ProviderRegistryService, AiConfigService],
})
export class AiProviderModule {}
