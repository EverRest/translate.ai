import { ConfigService } from '@nestjs/config';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import { EmbeddingRegistryService } from './embedding-registry.service';
import { OpenAiEmbeddingProvider } from '../infrastructure/openai-embedding.provider';
import { OllamaEmbeddingProvider } from '../infrastructure/ollama-embedding.provider';

describe('EmbeddingRegistryService', () => {
  const openAi = {
    name: 'openai',
    embed: jest.fn(),
  } as unknown as OpenAiEmbeddingProvider;
  const ollama = {
    name: 'ollama',
    embed: jest.fn(),
  } as unknown as OllamaEmbeddingProvider;
  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'EMBEDDING_PROVIDER') {
        return 'openai';
      }
      return defaultValue;
    }),
  } as unknown as ConfigService;

  let service: EmbeddingRegistryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmbeddingRegistryService(config, openAi, ollama);
  });

  it('falls back to ollama when openai is unavailable', async () => {
    (openAi.embed as jest.Mock).mockRejectedValue(
      new ProviderUnavailableException('openai', 'OPENAI_API_KEY not set'),
    );
    (ollama.embed as jest.Mock).mockResolvedValue([0.1, 0.2]);

    const result = await service.embed('Login');

    expect(result).toEqual([0.1, 0.2]);
    expect(ollama.embed).toHaveBeenCalledWith('Login');
  });
});
