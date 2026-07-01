import type {
  ImportDiffItem,
  ImportDiffSummary,
  ImportRow,
} from './import-document.types';
import { buildKeyContext } from './hint-parser';

export interface ExistingKey {
  id: string;
  key: string;
  sourceText: string;
  context: string | null;
}

export function computeImportDiff(
  importedRows: ImportRow[],
  existingKeys: ExistingKey[],
): { items: ImportDiffItem[]; summary: ImportDiffSummary } {
  const existingByKey = new Map(existingKeys.map((k) => [k.key, k]));
  const seenImportKeys = new Map<string, number>();
  const items: ImportDiffItem[] = [];
  const summary: ImportDiffSummary = {
    create: 0,
    update: 0,
    unchanged: 0,
    conflict: 0,
    invalid: 0,
    skip: 0,
  };

  for (const row of importedRows) {
    const key = row.key.trim();
    const sourceText = row.sourceText.trim();

    if (!key || !sourceText) {
      summary.invalid += 1;
      items.push({
        row,
        action: 'invalid',
        error: 'Missing key or source text',
      });
      continue;
    }

    const duplicateCount = (seenImportKeys.get(key) ?? 0) + 1;
    seenImportKeys.set(key, duplicateCount);
    if (duplicateCount > 1) {
      summary.invalid += 1;
      items.push({
        row,
        action: 'invalid',
        error: `Duplicate key in import: ${key}`,
      });
      continue;
    }

    const afterContext = buildKeyContext(row.scope, row.hints);
    const after = { sourceText, context: afterContext };
    const existing = existingByKey.get(key);

    if (!existing) {
      summary.create += 1;
      items.push({ row, action: 'create', after });
      continue;
    }

    const before = {
      sourceText: existing.sourceText,
      context: existing.context,
    };

    const sourceChanged = existing.sourceText !== sourceText;
    const contextChanged = (existing.context ?? '') !== (afterContext ?? '');

    if (!sourceChanged && !contextChanged) {
      summary.unchanged += 1;
      items.push({ row, action: 'unchanged', before, after });
      continue;
    }

    summary.update += 1;
    items.push({ row, action: 'update', before, after });
  }

  return { items, summary };
}
