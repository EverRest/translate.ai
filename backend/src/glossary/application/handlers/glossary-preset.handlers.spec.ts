import { ApplyGlossaryPresetHandler } from './glossary-preset.handlers';

describe('ApplyGlossaryPresetHandler', () => {
  const projectAccess = {
    getProjectForTenant: jest.fn().mockResolvedValue({ id: 'project-1' }),
  };

  const glossaryService = {
    ensureGlossary: jest.fn().mockResolvedValue({ id: 'glossary-1' }),
    applyPresetTerms: jest.fn().mockResolvedValue({ added: 24, skipped: 0 }),
  };

  let handler: ApplyGlossaryPresetHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new ApplyGlossaryPresetHandler(
      projectAccess as never,
      glossaryService as never,
    );
  });

  it('applies known glossary preset', async () => {
    const result = await handler.execute({
      tenantId: 'tenant-1',
      projectId: 'project-1',
      presetId: 'fifa_accreditation',
    });

    expect(glossaryService.ensureGlossary).toHaveBeenCalledWith('project-1');
    expect(glossaryService.applyPresetTerms).toHaveBeenCalled();
    expect(result.presetId).toBe('fifa_accreditation');
    expect(result.added).toBe(24);
  });
});
