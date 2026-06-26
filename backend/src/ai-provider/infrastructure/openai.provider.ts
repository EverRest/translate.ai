import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, TranslateOptions } from '../domain/ai-provider.interface';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import {
  buildTranslationPrompts,
  estimateOpenAiCost,
  ProviderTranslateResult,
} from './prompt.builder';

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

    const model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    const { systemPrompt, userPrompt } = buildTranslationPrompts(
      text,
      sourceLang,
      targetLang,
      options,
    );

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
