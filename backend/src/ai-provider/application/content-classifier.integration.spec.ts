import { ContentClassifierService } from './content-classifier.service';
import { OllamaClient } from '../infrastructure/ollama.client';
import { OllamaModelRouterService } from './ollama-model-router.service';

describe('ContentClassifierService', () => {
  const client = {
    generate: jest.fn(),
  } as unknown as OllamaClient;

  const router = {
    getClassifierModel: jest.fn().mockReturnValue('llama3.1:8b'),
  } as unknown as OllamaModelRouterService;

  it('uses rules only when mode is rules', async () => {
    const config = { get: jest.fn().mockReturnValue('rules') };
    const service = new ContentClassifierService(
      config as never,
      client,
      router,
    );

    const result = await service.classify('Legal contract text here', {
      context: 'legal agreement',
    });

    expect(result).toBe('legal');
    expect(client.generate).not.toHaveBeenCalled();
  });

  it('falls back to rules when classifier fails', async () => {
    const config = { get: jest.fn().mockReturnValue('classifier') };
    (client.generate as jest.Mock).mockRejectedValue(new Error('down'));
    const service = new ContentClassifierService(
      config as never,
      client,
      router,
    );

    const result = await service.classify('Hello', undefined);
    expect(result).toBe('chat');
  });
});
