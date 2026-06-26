import { scoreToVerdict, textSimilarityScore } from './similarity.utils';

describe('textSimilarityScore', () => {
  it('returns 1 for identical strings', () => {
    expect(textSimilarityScore('Hello', 'Hello')).toBe(1);
    expect(textSimilarityScore('  Hello  ', 'Hello')).toBe(1);
  });

  it('returns 0 when either side is empty', () => {
    expect(textSimilarityScore('', 'Hello')).toBe(0);
    expect(textSimilarityScore('Hello', '')).toBe(0);
  });

  it('returns a partial score for similar strings', () => {
    const score = textSimilarityScore('Hello world', 'Hello worl');
    expect(score).toBeGreaterThan(0.8);
    expect(score).toBeLessThan(1);
  });
});

describe('scoreToVerdict', () => {
  it('maps score ranges to verdicts', () => {
    expect(scoreToVerdict(1)).toBe('accurate');
    expect(scoreToVerdict(0.9)).toBe('accurate');
    expect(scoreToVerdict(0.75)).toBe('needs_edit');
    expect(scoreToVerdict(0.5)).toBe('inaccurate');
  });
});
