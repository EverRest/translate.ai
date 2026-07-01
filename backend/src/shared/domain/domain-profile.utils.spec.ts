import {
  formatDomainProfilePrompt,
  parseDomainProfile,
} from './domain-profile.utils';

describe('domain-profile.utils', () => {
  describe('parseDomainProfile', () => {
    it('returns null for empty or invalid input', () => {
      expect(parseDomainProfile(null)).toBeNull();
      expect(parseDomainProfile(undefined)).toBeNull();
      expect(parseDomainProfile('text')).toBeNull();
      expect(parseDomainProfile({})).toBeNull();
    });

    it('parses structured domain profile fields', () => {
      expect(
        parseDomainProfile({
          domain: 'sports',
          event: 'FIFA WC 2026',
          tone: 'formal',
          audience: 'accreditation',
          notes: 'Official copy',
          localeNotes: { fr: 'Use FIFA FR terms', es: '  ' },
        }),
      ).toEqual({
        domain: 'sports',
        event: 'FIFA WC 2026',
        tone: 'formal',
        audience: 'accreditation',
        notes: 'Official copy',
        localeNotes: { fr: 'Use FIFA FR terms' },
      });
    });
  });

  describe('formatDomainProfilePrompt', () => {
    it('returns empty string when profile is missing', () => {
      expect(formatDomainProfilePrompt(null)).toBe('');
      expect(formatDomainProfilePrompt(undefined)).toBe('');
    });

    it('formats domain block with target-language note', () => {
      const block = formatDomainProfilePrompt(
        {
          domain: 'sports',
          event: 'FIFA World Cup 2026',
          tone: 'formal',
          audience: 'accreditation',
          localeNotes: { fr: 'Official FIFA French terminology' },
        },
        'fr',
      );

      expect(block).toContain('Domain context:');
      expect(block).toContain('Domain: sports');
      expect(block).toContain('Event: FIFA World Cup 2026');
      expect(block).toContain('Tone: formal');
      expect(block).toContain('Audience: accreditation');
      expect(block).toContain(
        'Target-language guidance (fr): Official FIFA French terminology',
      );
    });
  });
});
