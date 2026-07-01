import type {
  ExcelParseRules,
  ExcelImportProfile,
} from '../domain/excel.types';

export class PreviewExcelImportCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly userId: string,
    public readonly buffer: Buffer,
    public readonly filename: string,
    public readonly parseRules?: ExcelParseRules,
  ) {}
}

export class DeltaTranslateExcelImportCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly languages?: string[],
    public readonly provider?: string,
  ) {}
}

export class DownloadExcelImportQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly sessionId: string,
  ) {}
}

export class GetExcelImportSessionQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly sessionId: string,
  ) {}
}

export class SaveExcelImportProfileCommand {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
    public readonly profile: ExcelImportProfile,
  ) {}
}

export class GetExcelImportProfileQuery {
  constructor(
    public readonly tenantId: string,
    public readonly projectId: string,
  ) {}
}
