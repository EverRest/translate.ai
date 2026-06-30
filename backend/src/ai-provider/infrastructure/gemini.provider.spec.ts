import { ConfigService } from '@nestjs/config';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import { GeminiProvider } from './gemini.provider';

function createConfig(overrides: Record<string, unknown> = {}): ConfigService {
  const values: Record<string, unknown> = {
    GEMINI_API_KEY: 'test-key',
    GEMINI_MODEL: 'gemini-2.0-flash',
    GEMINI_MODEL_FALLBACK: '',
    GEMINI_TRANSIENT_RETRIES: 2,
    GEMINI_TRANSIENT_RETRY_DELAY_MS: 0,
    ...overrides,
  };

  return {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;
}

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  function mock503Response() {
    return {
      ok: false,
      status: 503,
      text: () => Promise.resolve('unavailable'),
    } as Response;
  }

  function mockGeminiResponse(text: string) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text }] } }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        }),
    });
  }

  function lastFetchModel(): string {
    const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    const url = lastCall?.[0] as string;
    const match = url.match(/models\/([^:]+):generateContent/);
    return match?.[1] ?? '';
  }

  it('succeeds after transient 503 retries on primary model', async () => {
    provider = new GeminiProvider(createConfig());
    fetchMock
      .mockResolvedValueOnce(mock503Response())
      .mockResolvedValueOnce(mock503Response());
    mockGeminiResponse('Hola');

    const result = await provider.translate('Hello', 'en', 'es');

    expect(result.text).toBe('Hola');
    expect(result.usage.model).toBe('gemini-2.0-flash');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting transient retries when no model fallback', async () => {
    provider = new GeminiProvider(createConfig());
    fetchMock.mockResolvedValue(mock503Response());

    await expect(provider.translate('Hello', 'en', 'es')).rejects.toThrow(
      ProviderUnavailableException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-transient HTTP errors', async () => {
    provider = new GeminiProvider(
      createConfig({
        GEMINI_MODEL: 'gemini-2.5-flash-lite',
        GEMINI_MODEL_FALLBACK: 'gemini-2.0-flash',
      }),
    );
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('unauthorized'),
    });

    await expect(provider.translate('Hello', 'en', 'es')).rejects.toThrow(
      'HTTP 401',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to secondary model after primary transient exhaustion', async () => {
    provider = new GeminiProvider(
      createConfig({
        GEMINI_MODEL: 'gemini-2.5-flash-lite',
        GEMINI_MODEL_FALLBACK: 'gemini-2.0-flash',
      }),
    );

    fetchMock
      .mockResolvedValueOnce(mock503Response())
      .mockResolvedValueOnce(mock503Response())
      .mockResolvedValueOnce(mock503Response());
    mockGeminiResponse('Hola');

    const result = await provider.translate('Hello', 'en', 'es');

    expect(result.text).toBe('Hola');
    expect(result.usage.model).toBe('gemini-2.0-flash');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(lastFetchModel()).toBe('gemini-2.0-flash');
  });

  it('throws after both models exhaust transient retries', async () => {
    provider = new GeminiProvider(
      createConfig({
        GEMINI_MODEL: 'gemini-2.5-flash-lite',
        GEMINI_MODEL_FALLBACK: 'gemini-2.0-flash',
      }),
    );
    fetchMock.mockResolvedValue(mock503Response());

    await expect(provider.translate('Hello', 'en', 'es')).rejects.toThrow(
      ProviderUnavailableException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('dedupes when primary and fallback model are the same', async () => {
    provider = new GeminiProvider(
      createConfig({
        GEMINI_MODEL: 'gemini-2.0-flash',
        GEMINI_MODEL_FALLBACK: 'gemini-2.0-flash',
      }),
    );
    fetchMock.mockResolvedValue(mock503Response());

    await expect(provider.translate('Hello', 'en', 'es')).rejects.toThrow(
      ProviderUnavailableException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
