import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, TranslateOptions } from '../domain/ai-provider.interface';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import {
  buildTranslationPrompts,
  estimateOpenAiCost,
  ProviderTranslateResult,
} from './prompt.builder';
import { resolveOpenAiModelChain } from './openai-model-chain.utils';
import {
  computeRetryDelayMs,
  isTransientHttpStatus,
  parseHttpStatusFromProviderError,
  sleep,
} from './provider-http-retry.utils';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private readonly config: ConfigService) {}

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    options?: TranslateOptions,
  ): Promise<ProviderTranslateResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ProviderUnavailableException(
        'openai',
        'OPENAI_API_KEY not set',
      );
    }

    const primaryModel = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    const fallbackModel = this.config.get<string>('OPENAI_MODEL_FALLBACK', '');
    const models = resolveOpenAiModelChain(primaryModel, fallbackModel);

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

    let lastError: ProviderUnavailableException | undefined;

    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
      const model = models[modelIndex];
      try {
        return await this.translateWithModel(
          apiKey,
          model,
          systemPrompt,
          userPrompt,
          maxRetries,
          baseDelayMs,
        );
      } catch (error) {
        if (!(error instanceof ProviderUnavailableException)) {
          throw error;
        }

        lastError = error;
        const status = parseHttpStatusFromProviderError(error.message);
        const transientExhausted =
          status !== null && isTransientHttpStatus(status);
        const hasNextModel = modelIndex < models.length - 1;

        if (transientExhausted && hasNextModel) {
          this.logger.warn(
            `OpenAI model fallback: ${model} → ${models[modelIndex + 1]}`,
          );
          continue;
        }

        throw error;
      }
    }

    throw (
      lastError ??
      new ProviderUnavailableException('openai', 'translation failed')
    );
  }

  private async translateWithModel(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    maxRetries: number,
    baseDelayMs: number,
  ): Promise<ProviderTranslateResult> {
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
          `OpenAI transient HTTP ${status} on ${model}; retry ${attempt + 1}/${maxRetries} in ${delayMs}ms`,
        );
        await sleep(delayMs);
      }
    }

    throw (
      lastError ??
      new ProviderUnavailableException('openai', 'translation failed')
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

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`OpenAI error ${response.status}: ${body}`);
        throw new ProviderUnavailableException(
          'openai',
          `HTTP ${response.status}`,
        );
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new ProviderUnavailableException('openai', 'empty response');
      }

      const inputTokens = json.usage?.prompt_tokens ?? 0;
      const outputTokens = json.usage?.completion_tokens ?? 0;

      return {
        text: content,
        usage: {
          model,
          inputTokens,
          outputTokens,
          estimatedCostUsd: estimateOpenAiCost(
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
        'openai',
        error instanceof Error ? error.message : 'unknown error',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
