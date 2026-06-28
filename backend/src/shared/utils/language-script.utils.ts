export const CYRILLIC_TARGET_LANGS = new Set([
  'ua',
  'uk',
  'ru',
  'bg',
  'sr',
  'be',
  'mk',
]);

export function isCyrillicTargetLang(lang: string): boolean {
  return CYRILLIC_TARGET_LANGS.has(lang.toLowerCase());
}

export function cyrillicScriptHint(targetLang: string): string {
  return `Use Cyrillic script for ${targetLang}.`;
}
