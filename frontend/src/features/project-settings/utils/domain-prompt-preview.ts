import type { DomainProfile } from '../../projects/types';

export function buildDomainPromptPreview(
  profile: DomainProfile | null | undefined,
  targetLang = 'fr',
): string {
  if (!profile) {
    return '';
  }

  const lines: string[] = [];
  if (profile.domain) lines.push(`Domain: ${profile.domain}`);
  if (profile.event) lines.push(`Event: ${profile.event}`);
  if (profile.tone) lines.push(`Tone: ${profile.tone}`);
  if (profile.audience) lines.push(`Audience: ${profile.audience}`);
  if (profile.notes) lines.push(`Additional context: ${profile.notes}`);

  const localeNote = profile.localeNotes?.[targetLang];
  if (localeNote) {
    lines.push(`Target-language guidance (${targetLang}): ${localeNote}`);
  }

  if (lines.length === 0) {
    return '';
  }

  return `Domain context:\n${lines.join('\n')}`;
}
