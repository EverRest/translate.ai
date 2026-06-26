import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';

export interface OllamaGenerateResult {
  text: string;
  promptTokens: number;
  outputTokens: number;
}

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);

  constructor(private readonly config: ConfigService) {}

  getBaseUrl(): string {
    return this.config.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
  }

  getTimeoutMs(): number {
    return this.config.get<number>('OLLAMA_TIMEOUT_MS', 600_000);
  }

  async generate(
    model: string,
    prompt: string,
    timeoutMs?: number,
  ): Promise<OllamaGenerateResult> {
    const effectiveTimeout = timeoutMs ?? this.getTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), effectiveTimeout);

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`Ollama error ${response.status}: ${body}`);
        throw new ProviderUnavailableException(
          'ollama',
          `HTTP ${response.status}`,
        );
      }

      const json = (await response.json()) as { response?: string };
      const content = json.response?.trim();
      if (!content) {
        throw new ProviderUnavailableException('ollama', 'empty response');
      }

      return {
        text: content,
        promptTokens: Math.max(1, Math.ceil(prompt.length / 4)),
        outputTokens: Math.max(1, Math.ceil(content.length / 4)),
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableException) {
        throw error;
      }
      throw new ProviderUnavailableException(
        'ollama',
        error instanceof Error ? error.message : 'unknown error',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
