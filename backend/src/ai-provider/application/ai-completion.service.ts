import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import { resolveJobAiProvider } from '../domain/ai-provider.utils';
import { resolveGeminiModelChain } from '../infrastructure/gemini-model-chain.utils';
import { resolveOpenAiModelChain } from '../infrastructure/openai-model-chain.utils';
import {
  estimateGeminiCost,
  estimateOpenAiCost,
} from '../infrastructure/prompt.builder';

@Injectable()
export class AiCompletionService {
  private readonly logger = new Logger(AiCompletionService.name);

  constructor(private readonly config: ConfigService) {}

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    const primary = resolveJobAiProvider(
      this.config.get<string>('AI_PROVIDER', 'gemini'),
    );
    const fallbacks = this.config
      .get<string>('AI_PROVIDER_FALLBACK', 'openai')
      .split(',')
      .map((value) => resolveJobAiProvider(value.trim()))
      .filter(Boolean);

    const chain = [primary, ...fallbacks.filter((p) => p !== primary)];

    let lastError: Error | undefined;
    for (const provider of chain) {
      try {
        return await this.completeWithProvider(
          provider,
          systemPrompt,
          userPrompt,
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Completion provider ${provider} failed: ${lastError.message}`,
        );
      }
    }

    throw (
      lastError ??
      new ProviderUnavailableException('ai', 'all completion providers failed')
    );
  }

  private async completeWithProvider(
    provider: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    if (provider === 'gemini') {
      return this.completeGemini(systemPrompt, userPrompt);
    }
    if (provider === 'openai') {
      return this.completeOpenAi(systemPrompt, userPrompt);
    }
    throw new ProviderUnavailableException(
      provider,
      'completion not supported',
    );
  }

  private async completeGemini(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new ProviderUnavailableException(
        'gemini',
        'GEMINI_API_KEY not set',
      );
    }

    const primaryModel = this.config.get<string>(
      'GEMINI_MODEL',
      'gemini-2.0-flash',
    );
    const fallbackModel = this.config.get<string>('GEMINI_MODEL_FALLBACK', '');
    const models = resolveGeminiModelChain(primaryModel, fallbackModel);

    let lastError: Error | undefined;
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts: [{ text: userPrompt }] }],
              generationConfig: { temperature: 0.2 },
            }),
          },
        );

        if (!response.ok) {
          throw new ProviderUnavailableException(
            'gemini',
            `HTTP ${response.status}`,
          );
        }

        const json = (await response.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
          usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
          };
        };

        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) {
          throw new ProviderUnavailableException('gemini', 'empty response');
        }

        const inputTokens = json.usageMetadata?.promptTokenCount ?? 0;
        const outputTokens = json.usageMetadata?.candidatesTokenCount ?? 0;
        estimateGeminiCost(model, inputTokens, outputTokens);
        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw (
      lastError ??
      new ProviderUnavailableException('gemini', 'completion failed')
    );
  }

  private async completeOpenAi(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
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

    let lastError: Error | undefined;
    for (const model of models) {
      try {
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              temperature: 0.2,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
            }),
          },
        );

        if (!response.ok) {
          throw new ProviderUnavailableException(
            'openai',
            `HTTP ${response.status}`,
          );
        }

        const json = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };

        const text = json.choices?.[0]?.message?.content?.trim();
        if (!text) {
          throw new ProviderUnavailableException('openai', 'empty response');
        }

        estimateOpenAiCost(
          model,
          json.usage?.prompt_tokens ?? 0,
          json.usage?.completion_tokens ?? 0,
        );
        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw (
      lastError ??
      new ProviderUnavailableException('openai', 'completion failed')
    );
  }
}
