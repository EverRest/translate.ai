import { buildTranslationKeyListFilter } from './translation-key-filter.utils';

describe('buildTranslationKeyListFilter', () => {
  it('filters by localizationObjectId', () => {
    const where = buildTranslationKeyListFilter('proj-1', undefined, {
      localizationObjectId: 'obj-1',
    });
    expect(where).toEqual({
      projectId: 'proj-1',
      localizationObjectId: 'obj-1',
    });
  });

  it('filters by keyPrefix', () => {
    const where = buildTranslationKeyListFilter('proj-1', undefined, {
      keyPrefix: 'login_form.',
    });
    expect(where).toEqual({
      projectId: 'proj-1',
      key: { startsWith: 'login_form.', mode: 'insensitive' },
    });
  });

  it('combines search with object filter', () => {
    const where = buildTranslationKeyListFilter('proj-1', 'email', {
      localizationObjectId: 'obj-1',
    });
    expect(where.projectId).toBe('proj-1');
    expect(where.localizationObjectId).toBe('obj-1');
    expect(where.OR).toHaveLength(2);
  });
});
