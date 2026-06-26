import { OllamaProvider } from './ollama.provider';
import { ContentClassifierService } from '../application/content-classifier.service';
import { OllamaModelRouterService } from '../application/ollama-model-router.service';
import { OllamaClient } from './ollama.client';
import { OllamaPolishService } from './ollama-polish.service';

describe('OllamaProvider', () => {
  const client = {
    generate: jest.fn(),
  } as unknown as OllamaClient;

  const classifier = {
    classify: jest.fn().mockResolvedValue('marketing'),
  } as unknown as ContentClassifierService;

  const router = {
    selectModel: jest.fn().mockReturnValue('qwen2.5:7b'),
    getPolishModel: jest.fn().mockReturnValue('llama3.1:8b'),
  } as unknown as OllamaModelRouterService;

  const polish = {
    isEnabled: jest.fn().mockReturnValue(false),
    shouldPolish: jest.fn().mockReturnValue(true),
    polish: jest.fn(),
  } as unknown as OllamaPolishService;

  let provider: OllamaProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    (client.generate as jest.Mock).mockResolvedValue({
      text: 'Translated',
      promptTokens: 20,
      outputTokens: 10,
    });
    provider = new OllamaProvider(client, classifier, router, polish);
  });

  it('classifies, routes, and translates', async () => {
    const result = await provider.translate('Hello world', 'en', 'de');

    expect(classifier.classify).toHaveBeenCalled();
    expect(router.selectModel).toHaveBeenCalledWith('marketing', 11);
    expect(result.text).toBe('Translated');
    expect(result.usage.model).toBe('qwen2.5:7b');
  });

  it('applies polish when enabled', async () => {
    (polish.isEnabled as jest.Mock).mockReturnValue(true);
    (polish.polish as jest.Mock).mockResolvedValue({
      text: 'Polished translation',
      inputTokens: 5,
      outputTokens: 5,
    });

    const result = await provider.translate('Hello world', 'en', 'de');

    expect(polish.polish).toHaveBeenCalled();
    expect(result.text).toBe('Polished translation');
    expect(result.usage.model).toBe('qwen2.5:7b+polish');
  });
});
