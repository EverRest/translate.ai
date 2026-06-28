import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from '../domain/embedding-provider.interface';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';

@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiEmbeddingProvider.name);

  constructor(private readonly config: ConfigService) {}

  async embed(text: string): Promise<number[]> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ProviderUnavailableException(
        'openai',
        'OPENAI_API_KEY not set',
      );
    }

    const model = this.config.get<string>(
      'OPENAI_EMBEDDING_MODEL',
      'text-embedding-3-small',
    );
    const dimensions = this.config.get<number>('EMBEDDING_DIMENSIONS', 768);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: text,
          dimensions,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`OpenAI embedding error ${response.status}: ${body}`);
        throw new ProviderUnavailableException(
          'openai',
          `HTTP ${response.status}`,
        );
      }

      const json = (await response.json()) as {
        data?: Array<{ embedding?: number[] }>;
      };
      const embedding = json.data?.[0]?.embedding;
      if (!embedding?.length) {
        throw new ProviderUnavailableException('openai', 'empty embedding');
      }

      return embedding;
    } finally {
      clearTimeout(timeout);
    }
  }
}
