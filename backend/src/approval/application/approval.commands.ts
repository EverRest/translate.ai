export class ListProjectReviewsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly status: 'pending' | 'approved' = 'pending',
  ) {}
}

export class ApproveTranslationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly translationId: string,
  ) {}
}

export class RejectTranslationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly translationId: string,
    public readonly comment?: string,
  ) {}
}

export class PublishTranslationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly translationId: string,
  ) {}
}

export class UpdateTranslationValueCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly translationId: string,
    public readonly value: string,
  ) {}
}

export class BulkApproveTranslationsCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly projectId: string,
    public readonly translationIds: string[],
  ) {}
}

export class RetranslateTranslationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly translationId: string,
    public readonly provider?: string,
  ) {}
}
