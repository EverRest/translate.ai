import ExcelJS from 'exceljs';
import { parseExcelWorkbook, composeExcelWorkbook } from './excel.parser';

async function buildFixtureBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Translations');

  sheet.addRow(['Field ID', 'Scope', 'Key', 'EN', 'FR', 'ES']);
  sheet.addRow(['1001', 'Login', 'login.title', 'Sign in', 'Connexion', '']);
  sheet.addRow(['1002', 'Login', 'login.submit', 'Submit', '', '']);
  sheet.addRow(['1003', 'Cart', 'cart.total', 'Total: {{amount}}', '', '']);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

describe('excel.parser', () => {
  it('detects empty cells per language with Wiz Classic headers', async () => {
    const buffer = await buildFixtureBuffer();
    const result = await parseExcelWorkbook(buffer, { preset: 'wiz_classic' });

    expect(result.stats.validRows).toBe(3);
    expect(result.stats.emptyCellsByLang.fr).toBe(2);
    expect(result.stats.emptyCellsByLang.es).toBe(3);
    expect(result.layout.emptyCells).toHaveLength(5);
    expect(result.warnings).toHaveLength(0);
  });

  it('never includes filled cells in emptyCells list', async () => {
    const buffer = await buildFixtureBuffer();
    const result = await parseExcelWorkbook(buffer, { preset: 'wiz_classic' });

    const filledFr = result.layout.emptyCells.find(
      (c) => c.key === 'login.title' && c.targetLang === 'fr',
    );
    expect(filledFr).toBeUndefined();
  });

  it('compose fills only previously empty cells', async () => {
    const buffer = await buildFixtureBuffer();
    const parsed = await parseExcelWorkbook(buffer, { preset: 'wiz_classic' });

    const targetCell = parsed.layout.emptyCells.find(
      (c) => c.key === 'login.submit' && c.targetLang === 'fr',
    )!;
    const jobItemId = 'job-item-1';
    const translations = new Map([[jobItemId, 'Soumettre']]);

    const output = await composeExcelWorkbook(
      buffer,
      {
        sheetName: parsed.layout.sheetName,
        emptyCells: [{ ...targetCell, jobItemId }],
      },
      translations,
    );

    const roundTrip = await parseExcelWorkbook(output, {
      preset: 'wiz_classic',
    });
    const submitRow = roundTrip.sampleRows.find(
      (r) => r.key === 'login.submit',
    );
    expect(submitRow?.translations.fr).toBe('Soumettre');
    expect(submitRow?.fieldId).toBe('1002');

    const titleRow = roundTrip.sampleRows.find((r) => r.key === 'login.title');
    expect(titleRow?.translations.fr).toBe('Connexion');
    expect(titleRow?.fieldId).toBe('1001');
  });
});
