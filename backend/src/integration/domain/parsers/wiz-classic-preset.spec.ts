import {
  detectWizClassicMapping,
  resolveExcelColumns,
  WIZ_CLASSIC_PRESET,
} from './wiz-classic-preset';

describe('wiz-classic-preset', () => {
  it('detects Wiz Classic column layout', () => {
    const headers = ['Field ID', 'Scope', 'Key', 'EN', 'FR', 'ES'];
    const mapping = detectWizClassicMapping(headers);

    expect(mapping).not.toBeNull();
    expect(mapping?.fieldId).toBe('Field ID');
    expect(mapping?.targetLangColumns?.fr).toBe('FR');
    expect(mapping?.targetLangColumns?.es).toBe('ES');
  });

  it('resolves column roles from preset mapping', () => {
    const headers = ['Field ID', 'Scope', 'Key', 'EN', 'FR'];
    const columns = resolveExcelColumns(headers, WIZ_CLASSIC_PRESET);

    expect(columns.find((c) => c.role === 'fieldId')?.index).toBe(0);
    expect(columns.find((c) => c.role === 'key')?.index).toBe(2);
    expect(columns.find((c) => c.langCode === 'fr')?.role).toBe('target');
  });
});
