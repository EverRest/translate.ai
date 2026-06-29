export class ListGlossaryPresetsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class ApplyGlossaryPresetCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly presetId: string,
    public readonly mode: 'merge' | 'replace_all_in_preset',
  ) {}
}
