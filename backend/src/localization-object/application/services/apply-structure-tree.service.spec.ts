import { applyStructureTree } from './apply-structure-tree.service';

describe('applyStructureTree', () => {
  const prisma = {
    localizationNode: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    localizationObject: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => unknown) => Promise.resolve(callback(prisma)),
    );
    prisma.localizationNode.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: `id-${data.slug}`, ...data }),
    );
  });

  it('replaces nodes with nested tree', async () => {
    await applyStructureTree(prisma as never, 'obj-1', [
      {
        slug: 'title',
        nodeType: 'text',
        sourceText: 'Hello',
      },
      {
        slug: 'fields',
        nodeType: 'section',
        children: [
          {
            slug: 'email',
            nodeType: 'field',
            children: [
              {
                slug: 'label',
                nodeType: 'label',
                sourceText: 'Email',
              },
            ],
          },
        ],
      },
    ]);

    expect(prisma.localizationNode.deleteMany).toHaveBeenCalledWith({
      where: { objectId: 'obj-1' },
    });
    expect(prisma.localizationNode.create).toHaveBeenCalledTimes(4);
    expect(prisma.localizationObject.update).toHaveBeenCalledWith({
      where: { id: 'obj-1' },
      data: {
        status: 'draft',
        generationStatus: 'completed',
        generationError: null,
      },
    });
  });
});
