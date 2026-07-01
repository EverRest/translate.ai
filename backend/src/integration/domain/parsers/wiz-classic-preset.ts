import type { ExcelColumnMapping, ExcelColumnDef } from '../excel.types';

const FIELD_ID_ALIASES = ['field id', 'fieldid', 'field_id', 'id'];
const SCOPE_ALIASES = ['scope'];
const KEY_ALIASES = ['key'];
const SOURCE_ALIASES = [
  'en (source)',
  'en',
  'default (en)',
  'default',
  'english',
  'source',
];

const ISO_LANG_PATTERN = /^[a-z]{2}$/i;

export const WIZ_CLASSIC_PRESET: ExcelColumnMapping = {
  fieldId: 'Field ID',
  scope: 'Scope',
  key: 'Key',
  sourceLang: 'EN',
};

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

export function detectWizClassicMapping(
  headers: string[],
): ExcelColumnMapping | null {
  const normalized = headers.map(normalizeHeader);
  const hasFieldId = normalized.some((h) => FIELD_ID_ALIASES.includes(h));
  const hasKey = normalized.some((h) => KEY_ALIASES.includes(h));
  const hasSource = normalized.some((h) => SOURCE_ALIASES.includes(h));

  if (!hasFieldId || !hasKey || !hasSource) {
    return null;
  }

  const mapping: ExcelColumnMapping = { ...WIZ_CLASSIC_PRESET };
  const targetLangColumns: Record<string, string> = {};

  for (const header of headers) {
    const norm = normalizeHeader(header);
    if (
      FIELD_ID_ALIASES.includes(norm) ||
      SCOPE_ALIASES.includes(norm) ||
      KEY_ALIASES.includes(norm) ||
      SOURCE_ALIASES.includes(norm)
    ) {
      continue;
    }
    if (ISO_LANG_PATTERN.test(header.trim())) {
      targetLangColumns[header.trim().toLowerCase()] = header;
    }
  }

  if (Object.keys(targetLangColumns).length > 0) {
    mapping.targetLangColumns = targetLangColumns;
  }

  return mapping;
}

export function resolveExcelColumns(
  headers: string[],
  mapping?: ExcelColumnMapping,
): ExcelColumnDef[] {
  const normalized = headers.map(normalizeHeader);
  const findIndex = (aliases: string[], explicit?: string): number => {
    if (explicit) {
      const idx = normalized.indexOf(normalizeHeader(explicit));
      if (idx >= 0) {
        return idx;
      }
    }
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx >= 0) {
        return idx;
      }
    }
    return -1;
  };

  const fieldIdIdx = findIndex(FIELD_ID_ALIASES, mapping?.fieldId);
  const scopeIdx = findIndex(SCOPE_ALIASES, mapping?.scope);
  const keyIdx = findIndex(KEY_ALIASES, mapping?.key);
  const sourceIdx = findIndex(SOURCE_ALIASES, mapping?.sourceLang);

  const columns: ExcelColumnDef[] = headers.map((header, index) => {
    let role: ExcelColumnDef['role'] = 'unknown';
    let langCode: string | undefined;

    if (index === fieldIdIdx) {
      role = 'fieldId';
    } else if (index === scopeIdx) {
      role = 'scope';
    } else if (index === keyIdx) {
      role = 'key';
    } else if (index === sourceIdx) {
      role = 'source';
    } else {
      const norm = normalizeHeader(header);
      const mappedLang = mapping?.targetLangColumns
        ? Object.entries(mapping.targetLangColumns).find(
            ([code, col]) => normalizeHeader(col) === norm || code === norm,
          )
        : undefined;
      if (mappedLang) {
        role = 'target';
        langCode = mappedLang[0].toLowerCase();
      } else if (ISO_LANG_PATTERN.test(header.trim())) {
        role = 'target';
        langCode = header.trim().toLowerCase();
      }
    }

    return { index, header, role, langCode };
  });

  return columns;
}
