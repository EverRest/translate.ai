import { ExportFormatService } from './export-format.service';

describe('ExportFormatService', () => {
  const service = new ExportFormatService();

  it('renders json grouped by language', () => {
    const result = service.render(
      'json',
      [
        { key: 'hello', language: 'de', value: 'Hallo' },
        { key: 'bye', language: 'de', value: 'Tschüss' },
      ],
      'de',
    );

    expect(result.filename).toBe('de.json');
    expect(result.contentType).toBe('application/json');
    expect(JSON.parse(result.content)).toEqual({
      hello: 'Hallo',
      bye: 'Tschüss',
    });
  });

  it('renders po with msgid/msgstr pairs', () => {
    const result = service.render(
      'po',
      [{ key: 'hello', language: 'fr', value: 'Bonjour' }],
      'fr',
    );

    expect(result.filename).toBe('fr.po');
    expect(result.content).toContain('msgid "hello"');
    expect(result.content).toContain('msgstr "Bonjour"');
  });
});
