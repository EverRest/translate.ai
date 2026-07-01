import { computeImportDiff } from './import-diff.utils';
import type { ImportRow } from './import-document.types';

describe('import-diff.utils', () => {
  const rows: ImportRow[] = [
    {
      scope: 'BMA/Login',
      key: 'login.title',
      sourceText: 'Sign in',
      hints: 'Header',
    },
    {
      scope: 'BMA/Login',
      key: 'login.submit',
      sourceText: 'Log in',
      hints: 'Keep %%userName%%',
    },
  ];

  it('marks all rows as create when project is empty', () => {
    const { items, summary } = computeImportDiff(rows, []);
    expect(summary.create).toBe(2);
    expect(items.every((item) => item.action === 'create')).toBe(true);
  });

  it('marks unchanged when source and context match', () => {
    const { summary } = computeImportDiff(rows, [
      {
        id: '1',
        key: 'login.title',
        sourceText: 'Sign in',
        context: 'scope: BMA/Login\nhints: Header',
      },
    ]);
    expect(summary.unchanged).toBe(1);
    expect(summary.create).toBe(1);
  });

  it('marks update when source text changes', () => {
    const { summary } = computeImportDiff(rows, [
      {
        id: '1',
        key: 'login.title',
        sourceText: 'Old title',
        context: null,
      },
    ]);
    expect(summary.update).toBe(1);
  });

  it('marks duplicate keys in import as invalid', () => {
    const dupes: ImportRow[] = [
      { key: 'dup', sourceText: 'A' },
      { key: 'dup', sourceText: 'B' },
    ];
    const { summary } = computeImportDiff(dupes, []);
    expect(summary.invalid).toBe(1);
    expect(summary.create).toBe(1);
  });
});
