import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../audit/application/audit.service';
import { AiProvider, TranslateOptions } from '../domain/ai-provider.interface';
import {
  SupportedProvider,
  TranslateContext,
  TranslateWithFallbackResult,
} from '../domain/ai-provider.types';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import { resolveJobAiProvider } from '../domain/ai-provider.utils';
import { ProviderTranslateResult } from '../infrastructure/prompt.builder';
import { GeminiProvider } from '../infrastructure/gemini.provider';
import { OllamaProvider } from '../infrastructure/ollama.provider';
import { OpenAiProvider } from '../infrastructure/openai.provider';

@Injectable()
export class ProviderRegistryService {
  private readonly logger = new Logger(ProviderRegistryService.name);

  constructor(
    private readonly openAiProvider: OpenAiProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly ollamaProvider: OllamaProvider,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  resolve(providerName: string): AiProvider {
    switch (providerName) {
      case 'openai':
        return this.openAiProvider;
      case 'gemini':
        return this.geminiProvider;
      case 'ollama':
        return this.ollamaProvider;
      default:
        throw new ProviderUnavailableException(providerName, 'not supported');
    }
  }

  buildFallbackChain(primary: string): SupportedProvider[] {
    const normalized = resolveJobAiProvider(primary);
    const configured = this.config
      .get<string>('AI_PROVIDER_FALLBACK', 'gemini,ollama')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => resolveJobAiProvider(p));

    const chain: SupportedProvider[] = [normalized];
    for (const provider of configured) {
      if (!chain.includes(provider)) {
        chain.push(provider);
      }
    }
    return chain;
  }

  async translate(
    providerName: string,
    text: string,
    sourceLang: string,
    targetLang: string,
    options?: TranslateOptions,
  ): Promise<ProviderTranslateResult> {
    const provider = this.resolve(providerName);
    return provider.translate(text, sourceLang, targetLang, options);
  }

  async translateWithFallback(
    primaryProvider: string,
    text: string,
    sourceLang: string,
    targetLang: string,
    options: TranslateOptions | undefined,
    context: TranslateContext,
  ): Promise<TranslateWithFallbackResult & ProviderTranslateResult> {
    const chain = this.buildFallbackChain(primaryProvider);
    let lastError: Error | undefined;

    for (let index = 0; index < chain.length; index++) {
      const providerName = chain[index];
      try {
        const result = await this.translate(
          providerName,
          text,
          sourceLang,
          targetLang,
          options,
        );

        if (index > 0) {
          this.logger.warn(
            `Provider fallback: ${chain[0]} → ${providerName} (tenant=${context.tenantId})`,
          );
          await this.audit.log({
            tenantId: context.tenantId,
            entity: 'ai_provider',
            entityId: context.jobItemId ?? context.jobId ?? context.tenantId,
            action: 'provider_fallback',
            payload: {
              primaryProvider: chain[0],
              usedProvider: providerName,
              attempt: index + 1,
            },
          });
        }

        return {
          ...result,
          provider: providerName,
          usedFallback: index > 0,
          primaryProvider: chain[0],
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Provider ${providerName} failed: ${lastError.message}`,
        );
      }
    }

    throw (
      lastError ??
      new ProviderUnavailableException(primaryProvider, 'all providers failed')
    );
  }

  private normalizeProvider(name: string): SupportedProvider {
    return resolveJobAiProvider(name);
  }
}
