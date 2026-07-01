import { GlossaryService } from './glossary.service';

describe('GlossaryService.copyTermsFromProject', () => {
  const prisma = {
    glossary: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    glossaryTerm: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  let service: GlossaryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GlossaryService(prisma as never);
  });

  it('copies source terms and skips duplicates in target', async () => {
    prisma.glossary.findUnique.mockResolvedValue({
      id: 'source-glossary',
      terms: [
        {
          sourceTerm: 'Accreditation',
          targetTerm: 'Accréditation',
          doNotTranslate: false,
          note: null,
        },
        {
          sourceTerm: 'FIFA',
          targetTerm: null,
          doNotTranslate: true,
          note: 'brand',
        },
      ],
    });
    prisma.glossary.upsert.mockResolvedValue({ id: 'target-glossary' });
    prisma.glossaryTerm.findMany.mockResolvedValue([{ sourceTerm: 'FIFA' }]);
    prisma.glossaryTerm.createMany.mockResolvedValue({ count: 1 });

    const result = await service.copyTermsFromProject(
      'source-project',
      'target-project',
    );

    expect(prisma.glossaryTerm.createMany).toHaveBeenCalledWith({
      data: [
        {
          glossaryId: 'target-glossary',
          sourceTerm: 'Accreditation',
          targetTerm: 'Accréditation',
          doNotTranslate: false,
          note: null,
        },
      ],
      skipDuplicates: true,
    });
    expect(result).toEqual({ added: 1, skipped: 1 });
  });

  it('returns zero counts when source has no glossary', async () => {
    prisma.glossary.findUnique.mockResolvedValue(null);

    const result = await service.copyTermsFromProject(
      'source-project',
      'target-project',
    );

    expect(prisma.glossary.upsert).not.toHaveBeenCalled();
    expect(result).toEqual({ added: 0, skipped: 0 });
  });
});
