import { OllamaPolishService } from './ollama-polish.service';
import { OllamaClient } from './ollama.client';

describe('OllamaPolishService', () => {
  const client = {
    generate: jest.fn().mockResolvedValue({
      text: 'Polished text',
      promptTokens: 10,
      outputTokens: 5,
    }),
  } as unknown as OllamaClient;

  it('skips polish for legal content', () => {
    const config = { get: jest.fn().mockReturnValue(true) };
    const service = new OllamaPolishService(config as never, client);
    expect(service.shouldPolish('legal')).toBe(false);
  });

  it('polishes general content when enabled', async () => {
    const config = { get: jest.fn().mockReturnValue(true) };
    const service = new OllamaPolishService(config as never, client);

    const result = await service.polish(
      'Original translation',
      'de',
      'marketing',
      'llama3.1:8b',
    );

    expect(result.text).toBe('Polished text');
    expect(client.generate).toHaveBeenCalled();
  });
});
