import { OllamaModelRouterService } from './ollama-model-router.service';

describe('OllamaModelRouterService', () => {
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        OLLAMA_MODEL_DEFAULT: 'qwen2.5:7b',
        OLLAMA_MODEL_FAST: 'llama3.1:8b',
        OLLAMA_MODEL_LITERAL: 'llama3.1:8b',
        OLLAMA_MODEL: 'qwen2.5:7b',
        OLLAMA_POLISH_MODEL: 'llama3.1:8b',
        OLLAMA_CLASSIFIER_MODEL: 'llama3.1:8b',
      };
      return values[key] ?? fallback;
    }),
  };

  let service: OllamaModelRouterService;

  beforeEach(() => {
    service = new OllamaModelRouterService(config as never);
  });

  it('routes legal content to literal model', () => {
    expect(service.selectModel('legal', 500)).toBe('llama3.1:8b');
  });

  it('routes ui content to fast model', () => {
    expect(service.selectModel('ui', 500)).toBe('llama3.1:8b');
  });

  it('routes short text to fast model', () => {
    expect(service.selectModel('general', 50)).toBe('llama3.1:8b');
  });

  it('routes marketing content to default model', () => {
    expect(service.selectModel('marketing', 500)).toBe('qwen2.5:7b');
  });
});
