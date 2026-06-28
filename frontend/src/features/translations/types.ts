export type Translation = {
  id: string;
  key: string;
  sourceText: string;
  language: string;
  value: string;
  status: string;
  provider: string | null;
  version: number;
};

export type TranslationRow = {
  keyId: string;
  key: string;
  sourceText: string;
  translations: Record<string, Translation | undefined>;
  translating?: boolean;
};

export type SortField = 'key' | 'sourceText';
export type SortDir = 'asc' | 'desc';

export type GridFilters = {
  search: string;
  status: string;
  sortField: SortField;
  sortDir: SortDir;
};
