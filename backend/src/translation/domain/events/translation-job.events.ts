export class TranslationJobCreatedEvent {
  constructor(
    public readonly jobId: string,
    public readonly projectId: string,
    public readonly tenantId: string,
  ) {}
}

export class TranslationJobCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly projectId: string,
    public readonly tenantId: string,
  ) {}
}

export class TranslationJobFailedEvent {
  constructor(
    public readonly jobId: string,
    public readonly projectId: string,
    public readonly tenantId: string,
  ) {}
}
