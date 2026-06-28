export function formatPgVector(values: number[]): string {
  return `[${values.join(',')}]`;
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
