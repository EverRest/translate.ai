import { validateHtmlTagBalance } from './html-tag-balance.validator';
import { validatePlaceholders } from './placeholder.validator';
import type { QaValidationResult } from './qa-validation.types';

const QA_VALIDATORS = [validatePlaceholders, validateHtmlTagBalance];

export function runTranslationQaValidators(
  sourceText: string,
  outputText: string,
): QaValidationResult {
  for (const validate of QA_VALIDATORS) {
    const result = validate(sourceText, outputText);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}
