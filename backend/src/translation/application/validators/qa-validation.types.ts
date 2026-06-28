export type QaValidationResult = {
  valid: boolean;
  reason?: string;
  validator?: string;
};

export type QaValidator = (
  sourceText: string,
  outputText: string,
) => QaValidationResult;
