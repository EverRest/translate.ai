export type TranslationJob = {
  id: string;
  projectId: string;
  projectName: string;
  status: string;
  provider: string | null;
  itemCount: number;
  createdAt: string;
};

export type JobFailureSummary = {
  summary: string;
  hint: string;
  sampleErrors: string[];
};

export type JobPlaceholderSummary = {
  placeholdersTotal: number;
  placeholdersPreserved: number;
};

export type FailedJobItem = {
  key: string;
  language: string;
  errorMessage: string | null;
};

export type JobDetail = {
  id: string;
  projectId: string;
  status: string;
  provider: string | null;
  mode?: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  objectProgress?: {
    objectsDone: number;
    objectsTotal: number;
  };
  failures: JobFailureSummary | null;
  placeholderSummary?: JobPlaceholderSummary;
  failedItems?: FailedJobItem[];
  createdAt: string;
};

export type CreateJobInput = {
  projectId: string;
  languages: string[];
  keys?: string[];
  keyItems?: Array<{
    key: string;
    sourceText: string;
    description?: string;
    context?: string;
  }>;
  provider?: string;
  clientRequestId?: string;
  onlyStale?: boolean;
};

export type ProjectLanguage = {
  id: string;
  code: string;
  projectId: string;
};

export type AiConfig = {
  defaultProvider: string;
  supportedProviders: string[];
  providerFallback: string[];
};
