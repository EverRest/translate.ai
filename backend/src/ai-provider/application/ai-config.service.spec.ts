import { ConfigService } from '@nestjs/config';
import { AiConfigService } from './ai-config.service';

describe('AiConfigService', () => {
  const config = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'AI_PROVIDER') {
        return 'gemini';
      }
      if (key === 'AI_PROVIDER_FALLBACK') {
        return 'openai';
      }
      return defaultValue;
    }),
  } as unknown as ConfigService;

  let service: AiConfigService;

  beforeEach(() => {
    service = new AiConfigService(config);
  });

  it('returns default provider from AI_PROVIDER env', () => {
    expect(service.getPublicConfig().defaultProvider).toBe('gemini');
  });

  it('returns supported providers from domain types', () => {
    expect(service.getPublicConfig().supportedProviders).toEqual([
      'openai',
      'gemini',
      'ollama',
    ]);
  });

  it('parses provider fallback chain from env', () => {
    expect(service.getPublicConfig().providerFallback).toEqual(['openai']);
  });

  it('falls back to gemini when AI_PROVIDER is invalid', () => {
    (config.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'AI_PROVIDER') {
        return 'invalid';
      }
      if (key === 'AI_PROVIDER_FALLBACK') {
        return 'openai,ollama';
      }
      return undefined;
    });

    expect(service.getPublicConfig().defaultProvider).toBe('gemini');
    expect(service.getPublicConfig().providerFallback).toEqual([
      'openai',
      'ollama',
    ]);
  });
});
