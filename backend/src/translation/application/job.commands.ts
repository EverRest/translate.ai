export type JobKeyItemInput = {
  key: string;
  sourceText: string;
  description?: string;
  context?: string;
  contentType?: string;
};

export class CreateTranslationJobCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly languages: string[],
    public readonly keys: string[],
    public readonly keyItems: JobKeyItemInput[] | undefined,
    public readonly provider?: string,
    public readonly clientRequestId?: string,
    public readonly createdById?: string,
  ) {}
}

export class RetryTranslationJobCommand {
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly scopedProjectId?: string,
  ) {}
}

export class CancelTranslationJobCommand {
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly scopedProjectId?: string,
  ) {}
}

export class ListTranslationJobsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string | undefined,
    public readonly page: number,
    public readonly limit: number,
    public readonly scopedProjectId?: string,
  ) {}
}

export class GetJobStatusQuery {
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly scopedProjectId?: string,
  ) {}
}
