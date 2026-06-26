import { Injectable } from '@nestjs/common';
import { ExportFormat, ExportRow } from '../application/export.commands';

@Injectable()
export class ExportFormatService {
  render(
    format: ExportFormat,
    rows: ExportRow[],
    language?: string,
  ): { content: string; contentType: string; filename: string } {
    const filtered = language
      ? rows.filter((r) => r.language === language)
      : rows;

    switch (format) {
      case 'json':
        return this.toJson(filtered, language);
      case 'yaml':
        return this.toYaml(filtered, language);
      case 'csv':
        return this.toCsv(filtered);
      case 'android-xml':
        return this.toAndroidXml(filtered, language);
      case 'ios-strings':
        return this.toIosStrings(filtered, language);
      case 'po':
        return this.toPo(filtered, language);
      default:
        return this.toJson(filtered, language);
    }
  }

  private toJson(rows: ExportRow[], language?: string) {
    const data: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      if (!data[row.language]) {
        data[row.language] = {};
      }
      data[row.language][row.key] = row.value;
    }

    const payload = language ? (data[language] ?? {}) : data;

    return {
      content: JSON.stringify(payload, null, 2),
      contentType: 'application/json',
      filename: language ? `${language}.json` : 'translations.json',
    };
  }

  private toYaml(rows: ExportRow[], language?: string) {
    const grouped: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      if (!grouped[row.language]) {
        grouped[row.language] = {};
      }
      grouped[row.language][row.key] = row.value;
    }

    const target = language ? { [language]: grouped[language] ?? {} } : grouped;
    const lines: string[] = [];
    for (const [lang, keys] of Object.entries(target)) {
      lines.push(`${lang}:`);
      for (const [key, value] of Object.entries(keys)) {
        lines.push(`  ${key}: ${JSON.stringify(value)}`);
      }
    }

    return {
      content: lines.join('\n'),
      contentType: 'text/yaml',
      filename: language ? `${language}.yaml` : 'translations.yaml',
    };
  }

  private toCsv(rows: ExportRow[]) {
    const lines = ['key,language,value'];
    for (const row of rows) {
      lines.push(
        `${csvEscape(row.key)},${csvEscape(row.language)},${csvEscape(row.value)}`,
      );
    }
    return {
      content: lines.join('\n'),
      contentType: 'text/csv',
      filename: 'translations.csv',
    };
  }

  private toAndroidXml(rows: ExportRow[], language?: string) {
    const lang = language ?? rows[0]?.language ?? 'en';
    const filtered = rows.filter((r) => r.language === lang);
    const body = filtered
      .map(
        (r) =>
          `    <string name="${escapeXml(r.key.replace(/\./g, '_'))}">${escapeXml(r.value)}</string>`,
      )
      .join('\n');

    return {
      content: `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${body}\n</resources>\n`,
      contentType: 'application/xml',
      filename: `strings-${lang}.xml`,
    };
  }

  private toIosStrings(rows: ExportRow[], language?: string) {
    const lang = language ?? rows[0]?.language ?? 'en';
    const filtered = rows.filter((r) => r.language === lang);
    const body = filtered
      .map((r) => `"${escapeStrings(r.key)}" = "${escapeStrings(r.value)}";`)
      .join('\n');

    return {
      content: body + '\n',
      contentType: 'text/plain',
      filename: `${lang}.strings`,
    };
  }

  private toPo(rows: ExportRow[], language?: string) {
    const lang = language ?? rows[0]?.language ?? 'en';
    const filtered = rows.filter((r) => r.language === lang);
    const header = `msgid ""\nmsgstr ""\n"Language: ${lang}\\n"\n`;
    const body = filtered
      .map(
        (r) =>
          `msgid ${JSON.stringify(r.key)}\nmsgstr ${JSON.stringify(r.value)}\n`,
      )
      .join('\n');

    return {
      content: header + body,
      contentType: 'text/plain',
      filename: `${lang}.po`,
    };
  }
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeStrings(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}
