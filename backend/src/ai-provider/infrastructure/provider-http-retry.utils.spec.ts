import {
  computeRetryDelayMs,
  isTransientHttpStatus,
  parseHttpStatusFromProviderError,
} from './provider-http-retry.utils';

describe('provider-http-retry.utils', () => {
  describe('isTransientHttpStatus', () => {
    it('returns true for retryable statuses', () => {
      expect(isTransientHttpStatus(503)).toBe(true);
      expect(isTransientHttpStatus(429)).toBe(true);
      expect(isTransientHttpStatus(502)).toBe(true);
    });

    it('returns false for non-retryable statuses', () => {
      expect(isTransientHttpStatus(401)).toBe(false);
      expect(isTransientHttpStatus(404)).toBe(false);
      expect(isTransientHttpStatus(500)).toBe(false);
    });
  });

  describe('computeRetryDelayMs', () => {
    it('uses exponential backoff from base delay', () => {
      expect(computeRetryDelayMs(0, 1000)).toBe(1000);
      expect(computeRetryDelayMs(1, 1000)).toBe(2000);
      expect(computeRetryDelayMs(2, 1000)).toBe(4000);
    });
  });

  describe('parseHttpStatusFromProviderError', () => {
    it('extracts HTTP status from provider error messages', () => {
      expect(
        parseHttpStatusFromProviderError(
          'AI provider unavailable: gemini (HTTP 503)',
        ),
      ).toBe(503);
      expect(parseHttpStatusFromProviderError('HTTP 429')).toBe(429);
      expect(parseHttpStatusFromProviderError('network down')).toBeNull();
    });
  });
});
