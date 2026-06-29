import { Prisma } from '@prisma/client';
import { GlossaryService } from './glossary.service';

describe('GlossaryService', () => {
  const prisma = {
    glossary: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    glossaryTerm: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: GlossaryService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.glossary.findFirst.mockReset();
    prisma.glossary.findMany.mockReset();
    prisma.glossary.create.mockReset();
    prisma.glossary.updateMany.mockReset();
    prisma.glossary.update.mockReset();
    prisma.glossaryTerm.findUnique.mockReset();
    prisma.glossaryTerm.findMany.mockReset();
    prisma.glossaryTerm.upsert.mockReset();
    prisma.glossaryTerm.count.mockReset();
    prisma.glossaryTerm.createMany.mockReset();
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => unknown) => Promise.resolve(callback(prisma)),
    );
    service = new GlossaryService(prisma as never);
  });

  function mockActiveGlossary(id = 'glossary-1') {
    prisma.glossary.findFirst.mockResolvedValue({
      id,
      projectId: 'project-1',
      name: 'Default',
      isDefault: true,
      isActive: true,
    });
  }

  describe('upsertTerm', () => {
    it('creates a new term when sourceTerm is absent', async () => {
      mockActiveGlossary();
      prisma.glossaryTerm.findUnique.mockResolvedValue(null);
      prisma.glossaryTerm.upsert.mockResolvedValue({
        id: 'term-1',
        sourceTerm: 'Title',
        targetTerm: 'Заголовок',
        doNotTranslate: false,
        note: null,
      });

      const result = await service.upsertTerm('project-1', {
        sourceTerm: 'Title',
        targetTerm: 'Заголовок',
        doNotTranslate: false,
      });

      expect(result.created).toBe(true);
      expect(result.term).toEqual({
        id: 'term-1',
        sourceTerm: 'Title',
        targetTerm: 'Заголовок',
        doNotTranslate: false,
        note: null,
      });
    });

    it('updates an existing term and returns created=false', async () => {
      mockActiveGlossary();
      prisma.glossaryTerm.findUnique.mockResolvedValue({ id: 'term-1' });
      prisma.glossaryTerm.upsert.mockResolvedValue({
        id: 'term-1',
        sourceTerm: 'Title',
        targetTerm: 'Название',
        doNotTranslate: false,
        note: 'updated',
      });

      const result = await service.upsertTerm('project-1', {
        sourceTerm: ' Title ',
        targetTerm: 'Название',
        note: 'updated',
      });

      expect(result.created).toBe(false);
      expect(prisma.glossaryTerm.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            glossaryId_sourceTerm: {
              glossaryId: 'glossary-1',
              sourceTerm: 'Title',
            },
          },
        }),
      );
    });

    it('uses transaction client when provided', async () => {
      const tx = {
        glossary: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'glossary-1',
            projectId: 'project-1',
            isActive: true,
          }),
        },
        glossaryTerm: {
          findUnique: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockResolvedValue({
            id: 'term-1',
            sourceTerm: 'Checkout',
            targetTerm: 'Kasse',
            doNotTranslate: false,
            note: null,
          }),
        },
      };

      await service.upsertTerm(
        'project-1',
        { sourceTerm: 'Checkout', targetTerm: 'Kasse' },
        tx as unknown as Prisma.TransactionClient,
      );

      expect(prisma.glossary.findFirst).not.toHaveBeenCalled();
      expect(tx.glossary.findFirst).toHaveBeenCalled();
    });
  });

  describe('getActiveGlossary', () => {
    it('creates default glossary when project has none', async () => {
      prisma.glossary.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.glossary.create.mockResolvedValue({
        id: 'glossary-new',
        name: 'Default',
        isDefault: true,
        isActive: true,
      });

      const glossary = await service.getActiveGlossary('project-1');

      expect(glossary.id).toBe('glossary-new');
      expect(prisma.glossary.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          name: 'Default',
          isDefault: true,
          isActive: true,
        },
      });
    });
  });

  describe('activateGlossary', () => {
    it('deactivates others and activates target', async () => {
      prisma.glossary.findFirst.mockResolvedValue({ id: 'glossary-2' });
      prisma.glossary.updateMany.mockResolvedValue({ count: 1 });
      prisma.glossary.update.mockResolvedValue({});

      const result = await service.activateGlossary('project-1', 'glossary-2');

      expect(result).toEqual({ activated: true, glossaryId: 'glossary-2' });
      expect(prisma.glossary.updateMany).toHaveBeenCalled();
      expect(prisma.glossary.update).toHaveBeenCalledWith({
        where: { id: 'glossary-2' },
        data: { isActive: true },
      });
    });
  });

  describe('bulkUpsertTerms', () => {
    it('upserts each term and returns counts', async () => {
      jest
        .spyOn(service, 'upsertTerm')
        .mockResolvedValueOnce({
          term: {
            id: 't1',
            sourceTerm: 'A',
            targetTerm: 'a',
            doNotTranslate: false,
            note: null,
          },
          created: true,
        })
        .mockResolvedValueOnce({
          term: {
            id: 't2',
            sourceTerm: 'B',
            targetTerm: 'b',
            doNotTranslate: false,
            note: null,
          },
          created: false,
        });

      const result = await service.bulkUpsertTerms('project-1', [
        { sourceTerm: 'A', targetTerm: 'a' },
        { sourceTerm: 'B', targetTerm: 'b' },
      ]);

      expect(result).toEqual({ created: 1, updated: 1, total: 2 });
    });
  });
});
