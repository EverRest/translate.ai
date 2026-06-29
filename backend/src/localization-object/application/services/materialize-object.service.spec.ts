import { buildTreeFromNodes } from '../../domain/build-tree.utils';
import { flattenTreeToKeyPaths } from '../../domain/flatten-tree.utils';
import { resolveNodeContentType } from '../../domain/node-content-type.utils';
import { MaterializeObjectService } from './materialize-object.service';

describe('MaterializeObjectService', () => {
  const prisma = {
    localizationObject: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    localizationNode: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    translationKey: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: MaterializeObjectService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => unknown) => Promise.resolve(callback(prisma)),
    );
    service = new MaterializeObjectService(prisma as never);
  });

  const nodes = [
    {
      id: 'n-title',
      objectId: 'obj-1',
      parentId: null,
      sortOrder: 0,
      nodeType: 'text',
      slug: 'title',
      label: null,
      sourceText: 'Create account',
      description: null,
      context: null,
      contentType: null,
      translationKeyId: null,
    },
    {
      id: 'n-submit',
      objectId: 'obj-1',
      parentId: null,
      sortOrder: 1,
      nodeType: 'button',
      slug: 'submit',
      label: null,
      sourceText: 'Go',
      description: null,
      context: null,
      contentType: null,
      translationKeyId: null,
    },
  ];

  it('creates translation keys for leaf nodes and links nodes', async () => {
    prisma.localizationObject.findFirst.mockResolvedValue({
      id: 'obj-1',
      projectId: 'proj-1',
      slug: 'registration_form',
      status: 'draft',
    });
    prisma.localizationNode.findMany.mockResolvedValue(nodes);
    prisma.translationKey.findFirst.mockResolvedValue(null);
    prisma.translationKey.create
      .mockResolvedValueOnce({ id: 'key-1' })
      .mockResolvedValueOnce({ id: 'key-2' });
    prisma.localizationNode.update.mockResolvedValue({});
    prisma.localizationObject.update.mockResolvedValue({});
    prisma.translationKey.update.mockResolvedValue({});

    const result = await service.materialize('proj-1', 'obj-1');

    expect(result).toEqual({
      created: 2,
      updated: 0,
      total: 2,
    });
    expect(prisma.translationKey.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj-1',
        key: 'registration_form.title',
        sourceText: 'Create account',
        contentType: 'ui',
        localizationObjectId: 'obj-1',
      }),
    });
    expect(prisma.localizationNode.update).toHaveBeenCalledWith({
      where: { id: 'n-title' },
      data: { translationKeyId: 'key-1' },
    });
    expect(prisma.localizationObject.update).toHaveBeenCalledWith({
      where: { id: 'obj-1' },
      data: { status: 'materialized' },
    });
  });

  it('updates existing keys on re-materialize', async () => {
    prisma.localizationObject.findFirst.mockResolvedValue({
      id: 'obj-1',
      projectId: 'proj-1',
      slug: 'registration_form',
      status: 'materialized',
    });
    prisma.localizationNode.findMany.mockResolvedValue([
      {
        ...nodes[0],
        sourceText: 'Updated title',
        translationKeyId: 'key-1',
      },
    ]);
    prisma.translationKey.findFirst.mockResolvedValue({
      id: 'key-1',
      localizationObjectId: 'obj-1',
    });
    prisma.translationKey.update.mockResolvedValue({ id: 'key-1' });
    prisma.localizationNode.update.mockResolvedValue({});
    prisma.localizationObject.update.mockResolvedValue({});

    const result = await service.materialize('proj-1', 'obj-1');

    expect(result).toEqual({
      created: 0,
      updated: 1,
      total: 1,
    });
    expect(prisma.translationKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: expect.objectContaining({
        sourceText: 'Updated title',
        contentType: 'ui',
      }),
    });
  });

  it('builds nested tree for flatten integration', () => {
    const tree = buildTreeFromNodes([
      {
        id: 'root',
        parentId: null,
        sortOrder: 0,
        slug: 'fields',
        nodeType: 'section',
        label: null,
        sourceText: null,
        description: null,
        context: null,
        contentType: null,
        translationKeyId: null,
      },
      {
        id: 'leaf',
        parentId: 'root',
        sortOrder: 0,
        slug: 'label',
        nodeType: 'label',
        label: null,
        sourceText: 'Email',
        description: null,
        context: null,
        contentType: null,
        translationKeyId: null,
      },
    ]);

    const leaves = flattenTreeToKeyPaths('registration_form', tree);
    expect(leaves[0]?.path).toBe('registration_form.fields.label');
    expect(resolveNodeContentType({ nodeType: 'label' })).toBe('ui');
  });
});
