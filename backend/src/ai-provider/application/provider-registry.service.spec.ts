import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../audit/application/audit.service';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import { ProviderRegistryService } from './provider-registry.service';
import { GeminiProvider } from '../infrastructure/gemini.provider';
import { OllamaProvider } from '../infrastructure/ollama.provider';
import { OpenAiProvider } from '../infrastructure/openai.provider';

describe('ProviderRegistryService', () => {
  const openAi = {
    translate: jest.fn(),
  } as unknown as OpenAiProvider;
  const gemini = {
    translate: jest.fn(),
  } as unknown as GeminiProvider;
  const ollama = {
    translate: jest.fn(),
  } as unknown as OllamaProvider;
  const config = {
    get: jest.fn().mockReturnValue('gemini,ollama'),
  } as unknown as ConfigService;
  const audit = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  let service: ProviderRegistryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProviderRegistryService(
      openAi,
      gemini,
      ollama,
      config,
      audit,
    );
  });

  it('builds fallback chain without duplicates', () => {
    expect(service.buildFallbackChain('openai')).toEqual([
      'openai',
      'gemini',
      'ollama',
    ]);
  });

  it('falls back to the next provider when primary fails', async () => {
    (openAi.translate as jest.Mock).mockRejectedValue(new Error('openai down'));
    (gemini.translate as jest.Mock).mockResolvedValue({
      text: 'Hallo',
      usage: {
        model: 'gemini-2.0-flash',
        inputTokens: 10,
        outputTokens: 5,
        estimatedCostUsd: 0.001,
      },
    });

    const result = await service.translateWithFallback(
      'openai',
      'Hello',
      'en',
      'de',
      undefined,
      { tenantId: 'tenant-1' },
    );

    expect(result.text).toBe('Hallo');
    expect(result.provider).toBe('gemini');
    expect(result.usedFallback).toBe(true);
    expect(audit.log).toHaveBeenCalled();
  });

  it('throws when all providers fail', async () => {
    (openAi.translate as jest.Mock).mockRejectedValue(new Error('openai down'));
    (gemini.translate as jest.Mock).mockRejectedValue(new Error('gemini down'));
    (ollama.translate as jest.Mock).mockRejectedValue(new Error('ollama down'));

    await expect(
      service.translateWithFallback('openai', 'Hello', 'en', 'de', undefined, {
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow('ollama down');
  });

  it('rejects unknown providers', () => {
    expect(() => service.buildFallbackChain('unknown')).toThrow(
      ProviderUnavailableException,
    );
  });
});
