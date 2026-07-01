import { DomainProfile } from './domain-profile.types';

const MAX_FIELD_LENGTH = 2000;
const MAX_LOCALE_NOTE_LENGTH = 1000;

function trimOptional(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, maxLength);
}

export function parseDomainProfile(value: unknown): DomainProfile | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const profile: DomainProfile = {};

  const domain = trimOptional(raw.domain, 200);
  const event = trimOptional(raw.event, 200);
  const tone = trimOptional(raw.tone, 100);
  const audience = trimOptional(raw.audience, 200);
  const notes = trimOptional(raw.notes, MAX_FIELD_LENGTH);

  if (domain) profile.domain = domain;
  if (event) profile.event = event;
  if (tone) profile.tone = tone;
  if (audience) profile.audience = audience;
  if (notes) profile.notes = notes;

  if (
    raw.localeNotes &&
    typeof raw.localeNotes === 'object' &&
    !Array.isArray(raw.localeNotes)
  ) {
    const localeNotes: Record<string, string> = {};
    for (const [lang, note] of Object.entries(
      raw.localeNotes as Record<string, unknown>,
    )) {
      const code = lang.trim().toLowerCase();
      const text = trimOptional(note, MAX_LOCALE_NOTE_LENGTH);
      if (code && text) {
        localeNotes[code] = text;
      }
    }
    if (Object.keys(localeNotes).length > 0) {
      profile.localeNotes = localeNotes;
    }
  }

  return Object.keys(profile).length > 0 ? profile : null;
}

export function formatDomainProfilePrompt(
  profile: DomainProfile | null | undefined,
  targetLang?: string,
): string {
  if (!profile) {
    return '';
  }

  const lines: string[] = [];

  if (profile.domain) {
    lines.push(`Domain: ${profile.domain}`);
  }
  if (profile.event) {
    lines.push(`Event: ${profile.event}`);
  }
  if (profile.tone) {
    lines.push(`Tone: ${profile.tone}`);
  }
  if (profile.audience) {
    lines.push(`Audience: ${profile.audience}`);
  }
  if (profile.notes) {
    lines.push(`Additional context: ${profile.notes}`);
  }

  const normalizedTarget = targetLang?.trim().toLowerCase();
  const localeNote =
    normalizedTarget && profile.localeNotes?.[normalizedTarget]
      ? profile.localeNotes[normalizedTarget]
      : undefined;
  if (localeNote) {
    lines.push(`Target-language guidance (${normalizedTarget}): ${localeNote}`);
  }

  if (lines.length === 0) {
    return '';
  }

  return `\nDomain context:\n${lines.join('\n')}`;
}

export function isDomainProfileEmpty(
  profile: DomainProfile | null | undefined,
): boolean {
  return !profile || Object.keys(profile).length === 0;
}
