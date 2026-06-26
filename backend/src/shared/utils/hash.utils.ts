import { createHash } from 'crypto';

export function translationMemoryHash(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
): string {
  return createHash('sha256')
    .update(`${sourceLang}:${targetLang}:${sourceText}`)
    .digest('hex');
}
