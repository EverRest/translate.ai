import { NotFoundException } from '@nestjs/common';
import { CopyGlossaryFromProjectHandler } from './copy-glossary-from-project.handler';

describe('CopyGlossaryFromProjectHandler', () => {
  const projectAccess = {
    getProjectForTenant: jest.fn().mockResolvedValue({ id: 'project-1' }),
  };

  const glossaryService = {
    copyTermsFromProject: jest.fn().mockResolvedValue({ added: 3, skipped: 1 }),
  };

  let handler: CopyGlossaryFromProjectHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CopyGlossaryFromProjectHandler(
      projectAccess as never,
      glossaryService as never,
    );
  });

  it('copies glossary terms between tenant projects', async () => {
    const result = await handler.execute({
      tenantId: 'tenant-1',
      sourceProjectId: 'source-project',
      targetProjectId: 'target-project',
    });

    expect(projectAccess.getProjectForTenant).toHaveBeenCalledWith(
      'tenant-1',
      'source-project',
    );
    expect(projectAccess.getProjectForTenant).toHaveBeenCalledWith(
      'tenant-1',
      'target-project',
    );
    expect(glossaryService.copyTermsFromProject).toHaveBeenCalledWith(
      'source-project',
      'target-project',
    );
    expect(result).toEqual({ added: 3, skipped: 1 });
  });

  it('denies access when source project is outside tenant', async () => {
    projectAccess.getProjectForTenant.mockRejectedValueOnce(
      new NotFoundException('Project not found'),
    );

    await expect(
      handler.execute({
        tenantId: 'tenant-1',
        sourceProjectId: 'other-tenant-project',
        targetProjectId: 'target-project',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(glossaryService.copyTermsFromProject).not.toHaveBeenCalled();
  });
});
