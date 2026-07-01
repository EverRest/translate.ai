import type { ParseRules } from '../domain/import-document.types';

export class CreateImportSessionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly userId: string,
    public readonly buffer: Buffer,
    public readonly filename?: string,
    public readonly sourceType?: string,
    public readonly parseRules?: ParseRules,
  ) {}
}

export class ApplyImportSessionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly sessionId: string,
    public readonly conflictStrategy: 'skip' | 'update' = 'update',
  ) {}
}

export class GetImportSessionQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly sessionId: string,
  ) {}
}

export class ListImportSessionsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}

export class PreviewImportSessionQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly sessionId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly action?: string,
  ) {}
}
