import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, TranslateOptions } from '../domain/ai-provider.interface';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import {
  buildTranslationPrompts,
  estimateGeminiCost,
  ProviderTranslateResult,
} from './prompt.builder';
import {
  computeRetryDelayMs,
  isTransientHttpStatus,
  parseHttpStatusFromProviderError,
  sleep,
} from './provider-http-retry.utils';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly config: ConfigService) {}

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    options?: TranslateOptions,
  ): Promise<ProviderTranslateResult> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new ProviderUnavailableException(
        'gemini',
        'GEMINI_API_KEY not set',
      );
    }

    const model = this.config.get<string>('GEMINI_MODEL', 'gemini-2.0-flash');
    const { systemPrompt, userPrompt } = buildTranslationPrompts(
      text,
      sourceLang,
      targetLang,
      options,
    );

    const maxRetries = this.config.get<number>('GEMINI_TRANSIENT_RETRIES', 2);
    const baseDelayMs = this.config.get<number>(
      'GEMINI_TRANSIENT_RETRY_DELAY_MS',
      1000,
    );
    const maxAttempts = maxRetries + 1;
    let lastError: ProviderUnavailableException | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.requestTranslation(
          apiKey,
          model,
          systemPrompt,
          userPrompt,
        );
      } catch (error) {
        if (!(error instanceof ProviderUnavailableException)) {
          throw error;
        }

        lastError = error;
        const status = parseHttpStatusFromProviderError(error.message);
        const canRetry =
          attempt < maxAttempts - 1 &&
          status !== null &&
          isTransientHttpStatus(status);

        if (!canRetry) {
          throw error;
        }

        const delayMs = computeRetryDelayMs(attempt, baseDelayMs);
        this.logger.warn(
          `Gemini transient HTTP ${status}; retry ${attempt + 1}/${maxRetries} in ${delayMs}ms`,
        );
        await sleep(delayMs);
      }
    }

    throw (
      lastError ??
      new ProviderUnavailableException('gemini', 'translation failed')
    );
  }

  private async requestTranslation(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<ProviderTranslateResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`Gemini error ${response.status}: ${body}`);
        throw new ProviderUnavailableException(
          'gemini',
          `HTTP ${response.status}`,
        );
      }

      const json = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
      };

      const content = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!content) {
        throw new ProviderUnavailableException('gemini', 'empty response');
      }

      const inputTokens = json.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = json.usageMetadata?.candidatesTokenCount ?? 0;

      return {
        text: content,
        usage: {
          model,
          inputTokens,
          outputTokens,
          estimatedCostUsd: estimateGeminiCost(
            model,
            inputTokens,
            outputTokens,
          ),
        },
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableException) {
        throw error;
      }
      throw new ProviderUnavailableException(
        'gemini',
        error instanceof Error ? error.message : 'unknown error',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
