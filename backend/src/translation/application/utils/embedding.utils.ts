export const DEFAULT_EMBEDDING_DIMENSIONS = 768;

export function formatPgVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export function similarityFromCosineDistance(distance: number): number {
  return 1 - distance;
}

export function meetsSimilarityThreshold(
  similarity: number,
  threshold: number,
): boolean {
  return similarity >= threshold;
}
