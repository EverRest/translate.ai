import {
  isSourceTextChanged,
  isTranslationStale,
  normalizeSourceText,
} from './stale-translation.utils';

describe('stale-translation.utils', () => {
  describe('normalizeSourceText', () => {
    it('trims and collapses whitespace', () => {
      expect(normalizeSourceText('  Hello   world  ')).toBe('Hello world');
    });
  });

  describe('isSourceTextChanged', () => {
    it('returns false for whitespace-only differences', () => {
      expect(isSourceTextChanged('First Name', '  First Name  ')).toBe(false);
      expect(isSourceTextChanged('A  B', 'A B')).toBe(false);
    });

    it('returns true when content differs', () => {
      expect(isSourceTextChanged('First Name', 'Given Name')).toBe(true);
    });
  });

  describe('isTranslationStale', () => {
    it('returns false when snapshot is missing', () => {
      expect(isTranslationStale(null, 'Hello')).toBe(false);
      expect(isTranslationStale('', 'Hello')).toBe(false);
    });

    it('returns true when snapshot differs from key source', () => {
      expect(isTranslationStale('First Name', 'Given Name')).toBe(true);
    });

    it('returns false when snapshot matches key source', () => {
      expect(isTranslationStale('First Name', 'First Name')).toBe(false);
      expect(isTranslationStale('First Name', '  First Name ')).toBe(false);
    });
  });
});
