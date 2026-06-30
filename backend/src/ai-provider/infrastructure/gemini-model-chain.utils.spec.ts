import { resolveGeminiModelChain } from './gemini-model-chain.utils';

describe('gemini-model-chain.utils', () => {
  it('returns primary only when fallback is empty', () => {
    expect(resolveGeminiModelChain('gemini-2.5-flash-lite', '')).toEqual([
      'gemini-2.5-flash-lite',
    ]);
    expect(resolveGeminiModelChain('gemini-2.5-flash-lite')).toEqual([
      'gemini-2.5-flash-lite',
    ]);
  });

  it('returns primary and fallback when both differ', () => {
    expect(
      resolveGeminiModelChain('gemini-2.5-flash-lite', 'gemini-2.0-flash'),
    ).toEqual(['gemini-2.5-flash-lite', 'gemini-2.0-flash']);
  });

  it('dedupes when primary and fallback are the same', () => {
    expect(
      resolveGeminiModelChain('gemini-2.0-flash', 'gemini-2.0-flash'),
    ).toEqual(['gemini-2.0-flash']);
  });

  it('trims whitespace', () => {
    expect(resolveGeminiModelChain('  gemini-a  ', '  gemini-b  ')).toEqual([
      'gemini-a',
      'gemini-b',
    ]);
  });
});
