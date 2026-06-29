import { resolveOpenAiModelChain } from './openai-model-chain.utils';

describe('openai-model-chain.utils', () => {
  it('returns primary only when fallback is empty', () => {
    expect(resolveOpenAiModelChain('gpt-4.1-mini', '')).toEqual([
      'gpt-4.1-mini',
    ]);
    expect(resolveOpenAiModelChain('gpt-4.1-mini')).toEqual(['gpt-4.1-mini']);
  });

  it('returns primary and fallback when both differ', () => {
    expect(resolveOpenAiModelChain('gpt-4.1-mini', 'gpt-4.1')).toEqual([
      'gpt-4.1-mini',
      'gpt-4.1',
    ]);
  });

  it('dedupes when primary and fallback are the same', () => {
    expect(resolveOpenAiModelChain('gpt-4.1', 'gpt-4.1')).toEqual(['gpt-4.1']);
  });

  it('trims whitespace', () => {
    expect(resolveOpenAiModelChain('  gpt-4.1-mini  ', '  gpt-4.1  ')).toEqual([
      'gpt-4.1-mini',
      'gpt-4.1',
    ]);
  });
});
