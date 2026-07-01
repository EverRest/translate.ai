export type ColumnMapping = {
  scope?: string;
  key?: string;
  sourceText?: string;
  hints?: string;
};

export type ParseRulesInput = {
  columnMapping?: ColumnMapping;
};

export function toParseRulesInput(
  columnMapping: ColumnMapping,
): ParseRulesInput | undefined {
  const hasValue = Object.values(columnMapping).some(Boolean);
  if (!hasValue) {
    return undefined;
  }
  return { columnMapping };
}
