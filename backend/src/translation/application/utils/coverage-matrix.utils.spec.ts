import {
  buildCoverageCell,
  computeCoverageRag,
  pickWorstCells,
  resolveKeyScope,
} from './coverage-matrix.utils';

describe('coverage-matrix.utils', () => {
  it('extracts scope from key context', () => {
    expect(resolveKeyScope('scope: BMA/Login\nhints: Header')).toBe(
      'BMA/Login',
    );
    expect(resolveKeyScope(null)).toBe('(unspecified)');
  });

  it('assigns green when approved pct >= 95', () => {
    expect(
      computeCoverageRag({
        total: 100,
        translated: 100,
        approved: 96,
        missing: 0,
        draft: 4,
      }),
    ).toBe('green');
  });

  it('assigns yellow when approved pct is 70-94', () => {
    expect(
      computeCoverageRag({
        total: 100,
        translated: 90,
        approved: 80,
        missing: 10,
        draft: 10,
      }),
    ).toBe('yellow');
  });

  it('assigns red when coverage is low', () => {
    const cell = buildCoverageCell('Forms', 'fr', {
      total: 50,
      translated: 20,
      approved: 10,
      missing: 30,
      draft: 10,
    });
    expect(cell.rag).toBe('red');
    expect(cell.approvedPct).toBe(20);
  });

  it('picks worst cells by approved pct', () => {
    const cells = [
      buildCoverageCell('A', 'fr', {
        total: 10,
        translated: 10,
        approved: 9,
        missing: 0,
        draft: 1,
      }),
      buildCoverageCell('B', 'de', {
        total: 10,
        translated: 5,
        approved: 2,
        missing: 5,
        draft: 3,
      }),
      buildCoverageCell('C', 'es', {
        total: 10,
        translated: 8,
        approved: 4,
        missing: 2,
        draft: 4,
      }),
    ];

    const worst = pickWorstCells(cells, 2);
    expect(worst.map((c) => c.scope)).toEqual(['B', 'C']);
  });
});
