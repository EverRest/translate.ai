import { TerminologyIssueStatus } from '@prisma/client';

export class ScanTerminologyCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}

export class ListTerminologyIssuesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly status?: TerminologyIssueStatus,
  ) {}
}

export class ResolveTerminologyIssueCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly issueId: string,
    public readonly canonicalValue: string,
    public readonly addToGlossary: boolean,
    public readonly retranslate: boolean,
    public readonly createdById?: string,
  ) {}
}

export class DismissTerminologyIssueCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly issueId: string,
  ) {}
}
