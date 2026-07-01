import { describe, expect, it } from 'vitest';
import {
  buildQueryString,
  parseContentDispositionFilename,
} from './download.utils';

describe('parseContentDispositionFilename', () => {
  it('parses quoted filename', () => {
    expect(
      parseContentDispositionFilename(
        'attachment; filename="de.json"',
        'fallback.json',
      ),
    ).toBe('de.json');
  });

  it('parses UTF-8 filename', () => {
    expect(
      parseContentDispositionFilename(
        "attachment; filename*=UTF-8''translations.po",
        'fallback.po',
      ),
    ).toBe('translations.po');
  });

  it('returns fallback when header is missing', () => {
    expect(parseContentDispositionFilename(null, 'translations.json')).toBe(
      'translations.json',
    );
  });
});

describe('buildQueryString', () => {
  it('builds query from defined params', () => {
    expect(
      buildQueryString({
        format: 'json',
        language: 'de',
        status: undefined,
      }),
    ).toBe('?format=json&language=de');
  });

  it('returns empty string when no params', () => {
    expect(buildQueryString({})).toBe('');
  });
});
