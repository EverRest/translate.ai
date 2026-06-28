import {
  meetsSimilarityThreshold,
  similarityFromCosineDistance,
} from './embedding.utils';

describe('embedding.utils', () => {
  it('maps cosine distance to similarity', () => {
    expect(similarityFromCosineDistance(0)).toBe(1);
    expect(similarityFromCosineDistance(0.08)).toBeCloseTo(0.92);
  });

  it('accepts matches at or above threshold', () => {
    expect(meetsSimilarityThreshold(0.92, 0.92)).toBe(true);
    expect(meetsSimilarityThreshold(0.95, 0.92)).toBe(true);
    expect(meetsSimilarityThreshold(0.91, 0.92)).toBe(false);
  });
});
