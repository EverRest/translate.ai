import { parseDomainProfile } from '../../../shared/domain/domain-profile.utils';
import { buildTranslateOptionsFromKey } from './translation-context.utils';

describe('translation-context.utils', () => {
  describe('buildTranslateOptionsFromKey', () => {
    it('includes domain profile from project context', () => {
      const options = buildTranslateOptionsFromKey(
        { description: 'Badge label', contentType: 'ui' },
        {
          name: 'FIFA Accred',
          description: 'Accreditation project',
          domainProfile: {
            domain: 'sports',
            event: 'FIFA World Cup 2026',
            tone: 'formal',
          },
        },
      );

      expect(options.projectName).toBe('FIFA Accred');
      expect(options.domainProfile).toEqual(
        parseDomainProfile({
          domain: 'sports',
          event: 'FIFA World Cup 2026',
          tone: 'formal',
        }),
      );
    });
  });
});
