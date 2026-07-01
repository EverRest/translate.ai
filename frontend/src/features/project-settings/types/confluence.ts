export type ConfluenceOAuthSetupHint = {
  steps: string[];
  scopes: string[];
  envVars: string[];
  redirectUri: string;
  docsUrl: string;
  credentialSource?: 'tenant' | 'platform' | 'none';
};

export type ColumnMapping = {
  scope?: string;
  key?: string;
  sourceText?: string;
  hints?: string;
};

export type ParseRulesJson = {
  columnMapping?: ColumnMapping;
};

export type ConfluenceIntegration = {
  connected: boolean;
  oauthAvailable: boolean;
  setupHint: ConfluenceOAuthSetupHint | null;
  connection?: {
    id: string;
    siteUrl: string;
    siteName: string | null;
    cloudId: string;
    tokenExpiresAt: string | null;
    connectedAt: string;
  };
  syncConfig?: {
    pageIds: string[];
    spaceKey: string | null;
    labelFilter: string | null;
    parseRulesJson: ParseRulesJson | null;
    autoApply: boolean;
    syncEnabled: boolean;
    syncIntervalMinutes: number | null;
    nextSyncAt: string | null;
    lastSyncedAt: string | null;
    lastSyncStatus: string | null;
    lastSyncSummary: {
      create?: number;
      update?: number;
      unchanged?: number;
    } | null;
    lastImportSessionId: string | null;
    lastErrorMessage: string | null;
  };
};

export type ConfluenceSpace = {
  id: string;
  key: string;
  name: string;
};

export type ConfluencePage = {
  id: string;
  title: string;
};

export type ConfluencePendingSite = {
  id: string;
  name: string;
  url: string;
};
