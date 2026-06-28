import { ConfigService } from '@nestjs/config';
import { ProviderUnavailableException } from '../domain/provider-unavailable.exception';
import { GeminiProvider } from './gemini.provider';

describe('GeminiProvider', () => {
  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        GEMINI_API_KEY: 'test-key',
        GEMINI_MODEL: 'gemini-2.0-flash',
        GEMINI_TRANSIENT_RETRIES: 2,
        GEMINI_TRANSIENT_RETRY_DELAY_MS: 0,
      };
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;

  let provider: GeminiProvider;
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new GeminiProvider(config);
    global.fetch = fetchMock;
  });

  function mockGeminiResponse(text: string, status = 200) {
    fetchMock.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(status === 200 ? '' : 'error body'),
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text }] } }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        }),
    });
  }

  it('succeeds after transient 503 retries', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve('unavailable'),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve('unavailable'),
      });

    mockGeminiResponse('Hola');

    const result = await provider.translate('Hello', 'en', 'es');

    expect(result.text).toBe('Hola');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting transient retries', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve('unavailable'),
    });

    await expect(provider.translate('Hello', 'en', 'es')).rejects.toThrow(
      ProviderUnavailableException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-transient HTTP errors', async () => {
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
});
