import { TranslationStatus } from '@prisma/client';
import { CoverageMatrixService } from './coverage-matrix.service';

describe('CoverageMatrixService', () => {
  const prisma = {
    translationKey: { findMany: jest.fn() },
    translation: { findMany: jest.fn() },
  };

  let service: CoverageMatrixService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CoverageMatrixService(prisma as never);
  });

  it('aggregates scope × language cells with RAG colors', async () => {
    prisma.translationKey.findMany.mockResolvedValue([
      { id: 'k1', context: 'scope: Forms\nhints: label' },
      { id: 'k2', context: 'scope: Forms\nhints: button' },
      { id: 'k3', context: 'scope: BMA/Login\nhints: title' },
    ]);
    prisma.translation.findMany.mockResolvedValue([
      {
        translationKeyId: 'k1',
        language: 'fr',
        value: 'Nom',
        status: TranslationStatus.approved,
      },
      {
        translationKeyId: 'k2',
        language: 'fr',
        value: 'Envoyer',
        status: TranslationStatus.approved,
      },
      {
        translationKeyId: 'k3',
        language: 'fr',
        value: 'Connexion',
        status: TranslationStatus.draft,
      },
      {
        translationKeyId: 'k1',
        language: 'de',
        value: 'Name',
        status: TranslationStatus.approved,
      },
    ]);

    const result = await service.getCoverageMatrix('project-1');

    expect(result.scopes).toEqual(['BMA/Login', 'Forms']);
    expect(result.languages).toEqual(['de', 'fr']);

    const formsFr = result.cells.find(
      (cell) => cell.scope === 'Forms' && cell.language === 'fr',
    );
    expect(formsFr).toMatchObject({
      total: 2,
      translated: 2,
      approved: 2,
      approvedPct: 100,
      rag: 'green',
    });

    const loginFr = result.cells.find(
      (cell) => cell.scope === 'BMA/Login' && cell.language === 'fr',
    );
    expect(loginFr).toMatchObject({
      total: 1,
      translated: 1,
      approved: 0,
      approvedPct: 0,
      rag: 'red',
    });

    expect(result.worstCells[0]?.scope).toBe('BMA/Login');
    expect(result.byLanguage.fr.approvedPct).toBe(67);
  });

  it('filters by scopes and languages', async () => {
    prisma.translationKey.findMany.mockResolvedValue([
      { id: 'k1', context: 'scope: Forms' },
      { id: 'k2', context: 'scope: Other' },
    ]);
    prisma.translation.findMany.mockResolvedValue([
      {
        translationKeyId: 'k1',
        language: 'fr',
        value: 'x',
        status: TranslationStatus.draft,
      },
      {
        translationKeyId: 'k2',
        language: 'de',
        value: 'y',
        status: TranslationStatus.draft,
      },
    ]);

    const result = await service.getCoverageMatrix('project-1', {
      scopes: ['Forms'],
      languages: ['fr'],
    });

    expect(result.scopes).toEqual(['Forms']);
    expect(result.languages).toEqual(['fr']);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0]).toMatchObject({ scope: 'Forms', language: 'fr' });
  });
});
