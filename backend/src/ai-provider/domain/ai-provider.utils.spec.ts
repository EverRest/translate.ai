import {
  isPseudoProvider,
  isSupportedAiProvider,
  resolveJobAiProvider,
  resolveStoredTranslationProvider,
} from './ai-provider.utils';

describe('ai-provider.utils', () => {
  describe('resolveJobAiProvider', () => {
    it('returns supported providers as-is', () => {
      expect(resolveJobAiProvider('openai')).toBe('openai');
      expect(resolveJobAiProvider('gemini')).toBe('gemini');
    });

    it('maps memory and mock to fallback', () => {
      expect(resolveJobAiProvider('memory')).toBe('gemini');
      expect(resolveJobAiProvider('mock')).toBe('gemini');
      expect(resolveJobAiProvider('memory', 'ollama')).toBe('ollama');
    });

    it('maps unknown values to fallback', () => {
      expect(resolveJobAiProvider('unknown', 'openai')).toBe('openai');
    });

    it('uses configured fallback when provider omitted', () => {
      expect(resolveJobAiProvider(undefined, 'openai')).toBe('openai');
      expect(resolveJobAiProvider(null, 'openai')).toBe('openai');
    });
  });

  describe('resolveStoredTranslationProvider', () => {
    it('keeps real AI providers', () => {
      expect(resolveStoredTranslationProvider('ollama', 'gemini')).toBe(
        'ollama',
      );
    });

    it('maps memory to job provider', () => {
      expect(resolveStoredTranslationProvider('memory', 'gemini')).toBe(
        'gemini',
      );
    });
  });

  describe('isPseudoProvider', () => {
    it('detects memory and mock', () => {
      expect(isPseudoProvider('memory')).toBe(true);
      expect(isPseudoProvider('gemini')).toBe(false);
    });
  });

  describe('isSupportedAiProvider', () => {
    it('accepts only configured backends', () => {
      expect(isSupportedAiProvider('gemini')).toBe(true);
      expect(isSupportedAiProvider('memory')).toBe(false);
    });
  });
});
