import { TranslationStatus } from '@prisma/client';

export class ListTranslationsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly language?: string,
    public readonly status?: TranslationStatus,
    public readonly keys?: string[],
    public readonly localizationObjectId?: string,
    public readonly keyPrefix?: string,
  ) {}
}

export class GetTranslationQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly translationId: string,
  ) {}
}

export class LookupTranslationsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly items: Array<{ key: string; language: string }>,
    public readonly status?: TranslationStatus,
  ) {}
}

export class RecordTranslationQualityCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly translationId: string,
    public readonly userId: string,
    public readonly score: number,
    public readonly referenceValue?: string,
    public readonly notes?: string,
  ) {}
}
