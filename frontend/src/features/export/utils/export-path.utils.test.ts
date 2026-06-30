import { describe, expect, it } from 'vitest';
import { buildExportPath } from './export-path.utils';

describe('buildExportPath', () => {
  it('builds export path with query params', () => {
    expect(
      buildExportPath('proj-1', {
        format: 'po',
        language: 'de',
        status: 'published',
      }),
    ).toBe('/projects/proj-1/export?format=po&language=de&status=published');
  });

  it('omits language when not set', () => {
    expect(
      buildExportPath('proj-1', {
        format: 'json',
        status: 'approved',
      }),
    ).toBe('/projects/proj-1/export?format=json&status=approved');
  });
});
