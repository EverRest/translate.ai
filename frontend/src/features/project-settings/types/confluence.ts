export type ConfluenceOAuthSetupHint = {
  steps: string[];
  scopes: string[];
  envVars: string[];
  redirectUri: string;
  docsUrl: string;
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
    autoApply: boolean;
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
