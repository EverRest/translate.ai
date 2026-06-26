export type TranslationJob = {
  id: string;
  projectId: string;
  projectName: string;
  status: string;
  provider: string | null;
  itemCount: number;
  createdAt: string;
};

export type JobDetail = {
  id: string;
  projectId: string;
  status: string;
  provider: string | null;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
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
};

export type ProjectLanguage = {
  id: string;
  code: string;
  projectId: string;
};
