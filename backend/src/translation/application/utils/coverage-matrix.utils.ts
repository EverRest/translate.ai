import { TranslationStatus } from '@prisma/client';
import { extractScopeFromContext } from '../../../integration/domain/hint-parser';

export const DEFAULT_COVERAGE_THRESHOLDS = {
  greenApprovedPct: 95,
  yellowApprovedPct: 70,
} as const;

export type CoverageRag = 'green' | 'yellow' | 'red';

export type CoverageCellCounts = {
  total: number;
  translated: number;
  approved: number;
  missing: number;
  draft: number;
};

export type CoverageCell = CoverageCellCounts & {
  scope: string;
  language: string;
  approvedPct: number;
  rag: CoverageRag;
};

export const UNSPECIFIED_SCOPE = '(unspecified)';

export function resolveKeyScope(context: string | null | undefined): string {
  return extractScopeFromContext(context) ?? UNSPECIFIED_SCOPE;
}

export function isApprovedStatus(status: TranslationStatus): boolean {
  return (
    status === TranslationStatus.approved ||
    status === TranslationStatus.published
  );
}

export function computeApprovedPct(approved: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((approved / total) * 100);
}

export function computeCoverageRag(
  counts: CoverageCellCounts,
  thresholds: {
    greenApprovedPct: number;
    yellowApprovedPct: number;
  } = DEFAULT_COVERAGE_THRESHOLDS,
): CoverageRag {
  if (counts.total === 0) return 'red';

  const approvedPct = computeApprovedPct(counts.approved, counts.total);
  if (approvedPct >= thresholds.greenApprovedPct) return 'green';
  if (approvedPct >= thresholds.yellowApprovedPct) return 'yellow';

  const draftHeavy =
    counts.translated > 0 && counts.draft / counts.translated >= 0.5;
  if (draftHeavy && approvedPct >= thresholds.yellowApprovedPct - 20) {
    return 'yellow';
  }

  return 'red';
}

export function buildCoverageCell(
  scope: string,
  language: string,
  counts: CoverageCellCounts,
): CoverageCell {
  const approvedPct = computeApprovedPct(counts.approved, counts.total);
  return {
    scope,
    language,
    ...counts,
    approvedPct,
    rag: computeCoverageRag(counts),
  };
}

export function pickWorstCells(
  cells: CoverageCell[],
  limit = 3,
): CoverageCell[] {
  return [...cells]
    .filter((cell) => cell.total > 0)
    .sort((a, b) => {
      if (a.approvedPct !== b.approvedPct) {
        return a.approvedPct - b.approvedPct;
      }
      return b.missing - a.missing;
    })
    .slice(0, limit);
}
