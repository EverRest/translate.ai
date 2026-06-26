export class TranslationPublishedEvent {
  constructor(
    public readonly translationId: string,
    public readonly projectId: string,
    public readonly tenantId: string,
    public readonly key: string,
    public readonly language: string,
  ) {}
}

export class TranslationApprovedEvent {
  constructor(
    public readonly translationId: string,
    public readonly projectId: string,
    public readonly tenantId: string,
  ) {}
}

export class TranslationRejectedEvent {
  constructor(
    public readonly translationId: string,
    public readonly projectId: string,
    public readonly tenantId: string,
  ) {}
}
