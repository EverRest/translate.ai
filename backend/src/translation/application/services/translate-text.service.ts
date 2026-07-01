import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiCompletionService } from '../../../ai-provider/application/ai-completion.service';
import { TranslateOptions } from '../../../ai-provider/domain/ai-provider.interface';
import { TranslateContext } from '../../../ai-provider/domain/ai-provider.types';
import { ProviderRegistryService } from '../../../ai-provider/application/provider-registry.service';
import { resolveJobAiProvider } from '../../../ai-provider/domain/ai-provider.utils';
import {
  buildObjectBatchPrompts,
  ObjectBatchStringInput,
  parseObjectBatchResponse,
} from '../../../ai-provider/infrastructure/object-batch-prompt.builder';
import { formatDomainProfilePrompt } from '../../../shared/domain/domain-profile.utils';
import { formatGlossaryPrompt } from '../../../ai-provider/infrastructure/prompt.builder';
import { AiUsageService } from '../../../billing/application/ai-usage.service';
import { sanitizeTranslationOutput } from '../../../shared/utils/translation-sanitize.utils';
import { TranslationMemoryService } from './translation-memory.service';

export interface TranslateResult {
  text: string;
  provider: string;
  usedFallback: boolean;
}

export interface ObjectBatchTranslateResult {
  translations: Record<string, string>;
  provider: string;
  usedFallback: boolean;
}

export interface TranslateRequest extends TranslateContext {
  text: string;
  targetLang: string;
  providerName: string;
  options?: TranslateOptions;
  sourceLang?: string;
  skipMemory?: boolean;
}

export interface ObjectBatchTranslateRequest extends TranslateContext {
  strings: ObjectBatchStringInput[];
  targetLang: string;
  providerName: string;
  options?: TranslateOptions & { fieldLabel?: string; retryHint?: string };
  sourceLang?: string;
}

@Injectable()
export class TranslateTextService {
  static mockBatchCallCount = 0;

  constructor(
    private readonly memory: TranslationMemoryService,
    private readonly providers: ProviderRegistryService,
    private readonly completion: AiCompletionService,
    private readonly usage: AiUsageService,
    private readonly config: ConfigService,
  ) {}

  async translate(request: TranslateRequest): Promise<TranslateResult> {
    if (this.isMockTranslationsEnabled()) {
      return {
        text: `[${request.targetLang}] ${request.text}`,
        provider: 'mock',
        usedFallback: false,
      };
    }

    const source =
      request.sourceLang ??
      this.config.get<string>('DEFAULT_SOURCE_LANGUAGE', 'en');

    const cached = request.skipMemory
      ? null
      : await this.memory.lookup(
          request.tenantId,
          request.text,
          source,
          request.targetLang,
        );
    if (cached) {
      return { text: cached, provider: 'memory', usedFallback: false };
    }

    const result = await this.providers.translateWithFallback(
      resolveJobAiProvider(request.providerName),
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

    const translatedText = sanitizeTranslationOutput(result.text, request.text);

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

  async translateObjectBatch(
    request: ObjectBatchTranslateRequest,
  ): Promise<ObjectBatchTranslateResult> {
    if (this.isMockTranslationsEnabled()) {
      TranslateTextService.mockBatchCallCount += 1;
      const translations: Record<string, string> = {};
      for (const item of request.strings) {
        translations[item.keyPath] =
          `[${request.targetLang}] ${item.sourceText}`;
      }
      return { translations, provider: 'mock', usedFallback: false };
    }

    const source =
      request.sourceLang ??
      this.config.get<string>('DEFAULT_SOURCE_LANGUAGE', 'en');

    const keyPaths = request.strings.map((item) => item.keyPath);
    const domainHint = formatDomainProfilePrompt(
      request.options?.domainProfile,
      request.targetLang,
    );
    const glossaryHint = request.options?.glossary
      ? formatGlossaryPrompt(request.options.glossary)
      : '';

    const { systemPrompt, userPrompt } = buildObjectBatchPrompts(
      request.strings,
      source,
      request.targetLang,
      {
        projectName: request.options?.projectName,
        projectDescription: request.options?.projectDescription,
        fieldLabel: request.options?.fieldLabel,
        domainHint,
        glossaryHint,
        retryHint: request.options?.retryHint,
      },
    );

    const raw = await this.completion.complete(systemPrompt, userPrompt);
    const parsed = parseObjectBatchResponse(raw, keyPaths);

    const translations: Record<string, string> = {};
    for (const item of request.strings) {
      const sanitized = sanitizeTranslationOutput(
        parsed[item.keyPath],
        item.sourceText,
      );
      translations[item.keyPath] = sanitized;

      await this.memory.store(
        request.tenantId,
        item.sourceText,
        source,
        request.targetLang,
        sanitized,
      );
    }

    const provider = resolveJobAiProvider(request.providerName);

    await this.usage.log({
      tenantId: request.tenantId,
      userId: request.userId,
      projectId: request.projectId,
      jobId: request.jobId,
      jobItemId: request.jobItemId,
      provider,
      primaryProvider: provider,
      usedFallback: false,
      usage: {
        model: 'object-batch',
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
      },
    });

    return { translations, provider, usedFallback: false };
  }

  private isMockTranslationsEnabled(): boolean {
    const fromConfig = this.config.get<string | boolean>('MOCK_TRANSLATIONS');
    if (fromConfig === true || fromConfig === 'true') {
      return true;
    }

    if (process.env.NODE_ENV === 'test') {
      const fromEnv = process.env.MOCK_TRANSLATIONS;
      return fromEnv === 'true' || fromEnv === '1';
    }

    return false;
  }
}
