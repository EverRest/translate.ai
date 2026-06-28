import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import { OpenAiEmbeddingProvider } from '../infrastructure/openai-embedding.provider';
import { OllamaEmbeddingProvider } from '../infrastructure/ollama-embedding.provider';

@Injectable()
export class EmbeddingRegistryService {
  private readonly logger = new Logger(EmbeddingRegistryService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly openAi: OpenAiEmbeddingProvider,
    private readonly ollama: OllamaEmbeddingProvider,
  ) {}

  async embed(text: string): Promise<number[]> {
    const configured = this.config.get<string>('EMBEDDING_PROVIDER', 'openai');
    const providers =
      configured === 'ollama'
        ? [this.ollama, this.openAi]
        : [this.openAi, this.ollama];

    let lastError: unknown;
    for (const provider of providers) {
      try {
        return await provider.embed(text);
      } catch (error) {
        lastError = error;
        if (error instanceof ProviderUnavailableException) {
          this.logger.warn(
            `Embedding provider ${provider.name} unavailable: ${error.message}`,
          );
          continue;
        }
        throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new ProviderUnavailableException('embedding', 'all providers failed');
  }
}
