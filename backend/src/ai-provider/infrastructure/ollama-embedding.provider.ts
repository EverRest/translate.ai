import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from '../domain/embedding-provider.interface';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import { OllamaClient } from './ollama.client';

@Injectable()
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'ollama';
  private readonly logger = new Logger(OllamaEmbeddingProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly ollama: OllamaClient,
  ) {}

  async embed(text: string): Promise<number[]> {
    const model = this.config.get<string>(
      'OLLAMA_EMBEDDING_MODEL',
      'nomic-embed-text',
    );
    const expectedDimensions = this.config.get<number>(
      'EMBEDDING_DIMENSIONS',
      768,
    );

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.ollama.getTimeoutMs(),
    );

    try {
      const response = await fetch(
        `${this.ollama.getBaseUrl()}/api/embeddings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt: text }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`Ollama embedding error ${response.status}: ${body}`);
        throw new ProviderUnavailableException(
          'ollama',
          `HTTP ${response.status}`,
        );
      }

      const json = (await response.json()) as { embedding?: number[] };
      const embedding = json.embedding;
      if (!embedding?.length) {
        throw new ProviderUnavailableException('ollama', 'empty embedding');
      }

      if (embedding.length !== expectedDimensions) {
        throw new ProviderUnavailableException(
          'ollama',
          `expected ${expectedDimensions} dimensions, got ${embedding.length}`,
        );
      }

      return embedding;
    } finally {
      clearTimeout(timeout);
    }
  }
}
