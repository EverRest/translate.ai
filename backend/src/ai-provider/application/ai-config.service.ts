import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SUPPORTED_PROVIDERS,
  SupportedProvider,
} from '../domain/ai-provider.types';
import { resolveJobAiProvider } from '../domain/ai-provider.utils';

export interface AiPublicConfig {
  defaultProvider: SupportedProvider;
  supportedProviders: readonly SupportedProvider[];
  providerFallback: SupportedProvider[];
}

@Injectable()
export class AiConfigService {
  constructor(private readonly config: ConfigService) {}

  getPublicConfig(): AiPublicConfig {
    const defaultProvider = resolveJobAiProvider(
      undefined,
      this.config.get<string>('AI_PROVIDER', 'gemini'),
    );

    const providerFallback = this.config
      .get<string>('AI_PROVIDER_FALLBACK', 'gemini,ollama')
      .split(',')
      .map((provider) => provider.trim())
      .filter(Boolean)
      .map((provider) => resolveJobAiProvider(provider));

    return {
      defaultProvider,
      supportedProviders: SUPPORTED_PROVIDERS,
      providerFallback,
    };
  }
}
