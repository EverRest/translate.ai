import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranslateOptions } from '../../../ai-provider/domain/ai-provider.interface';
import { TranslateContext } from '../../../ai-provider/domain/ai-provider.types';
import { ProviderRegistryService } from '../../../ai-provider/application/provider-registry.service';
import { AiUsageService } from '../../../billing/application/ai-usage.service';
import { stripWrappingQuotes } from '../../../shared/utils/string.utils';
import { TranslationMemoryService } from './translation-memory.service';

export interface TranslateResult {
  text: string;
  provider: string;
  usedFallback: boolean;
}

export interface TranslateRequest extends TranslateContext {
  text: string;
  targetLang: string;
  providerName: string;
  options?: TranslateOptions;
  sourceLang?: string;
}

@Injectable()
export class TranslateTextService {
  constructor(
    private readonly memory: TranslationMemoryService,
    private readonly providers: ProviderRegistryService,
    private readonly usage: AiUsageService,
    private readonly config: ConfigService,
  ) {}

  async translate(request: TranslateRequest): Promise<TranslateResult> {
    if (this.config.get<boolean>('MOCK_TRANSLATIONS')) {
      return {
        text: `[${request.targetLang}] ${request.text}`,
        provider: 'mock',
        usedFallback: false,
      };
    }

    const source =
      request.sourceLang ??
      this.config.get<string>('DEFAULT_SOURCE_LANGUAGE', 'en');

    const cached = await this.memory.lookup(
      request.tenantId,
      request.text,
      source,
      request.targetLang,
    );
    if (cached) {
      return { text: cached, provider: 'memory', usedFallback: false };
    }

    const result = await this.providers.translateWithFallback(
      request.providerName,
      request.text,
      source,
      request.targetLang,
      request.options,
      {
        tenantId: request.tenantId,
        projectId: request.projectId,
        jobId: request.jobId,
        jobItemId: request.jobItemId,
      },
    );

    const translatedText = stripWrappingQuotes(result.text);

    await this.memory.store(
      request.tenantId,
      request.text,
      source,
      request.targetLang,
      translatedText,
    );

    await this.usage.log({
      tenantId: request.tenantId,
      userId: request.userId,
      projectId: request.projectId,
      jobId: request.jobId,
      jobItemId: request.jobItemId,
      provider: result.provider,
      primaryProvider: result.primaryProvider,
      usedFallback: result.usedFallback,
      usage: result.usage,
    });

    return {
      text: translatedText,
      provider: result.provider,
      usedFallback: result.usedFallback,
    };
  }
}
