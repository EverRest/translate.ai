import { sanitizeTranslationOutput } from './translation-sanitize.utils';

describe('sanitizeTranslationOutput', () => {
  it('removes markdown code fences', () => {
    expect(sanitizeTranslationOutput('```\nHallo\n```')).toBe('Hallo');
  });

  it('removes translation prefixes', () => {
    expect(sanitizeTranslationOutput('Translation: Bonjour')).toBe('Bonjour');
  });

  it('strips wrapping quotes when source is unquoted', () => {
    expect(sanitizeTranslationOutput('"Bonjour"', 'Hello')).toBe('Bonjour');
  });

  it('preserves quotes when source is quoted', () => {
    expect(sanitizeTranslationOutput('"Bonjour"', '"Hello"')).toBe('"Bonjour"');
  });

  it('removes zero-width characters', () => {
    expect(sanitizeTranslationOutput('Bon\u200Bjour')).toBe('Bonjour');
  });

  it('strips German low-high quotes', () => {
    expect(sanitizeTranslationOutput('„Kasse"', 'Checkout')).toBe('Kasse');
  });

  it('collapses extra spaces while preserving newlines', () => {
    expect(sanitizeTranslationOutput('Line  one\n\n\nLine two')).toBe(
      'Line one\n\nLine two',
    );
  });
});
