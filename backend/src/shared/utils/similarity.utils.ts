export function textSimilarityScore(left: string, right: string): number {
  const a = left.trim();
  const b = right.trim();

  if (a === b) {
    return 1;
  }

  if (!a || !b) {
    return 0;
  }

  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, Math.min(1, 1 - distance / maxLen));
}

export function scoreToVerdict(
  score: number,
): 'accurate' | 'needs_edit' | 'inaccurate' {
  if (score >= 0.9) {
    return 'accurate';
  }

  if (score >= 0.6) {
    return 'needs_edit';
  }

  return 'inaccurate';
}

function levenshtein(left: string, right: string): number {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  );

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}
