export type UsageSummary = {
  totalRequests: number;
  totalCostUsd: number;
  fallbackCount: number;
  byProvider: Array<{
    provider: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  }>;
};

export type UsageLogEntry = {
  id: string;
  projectId: string;
  jobId: string | null;
  jobItemId: string | null;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  usedFallback: boolean;
  primaryProvider: string | null;
  createdAt: string;
};

export type AnalyticsFilters = {
  projectId?: string;
  from?: string;
  to?: string;
};

export type QualitySummary = {
  totalSamples: number;
  verifiedSamples: number;
  avgScore: number;
  accurateRate: number;
  byVerdict: Array<{ verdict: string; count: number }>;
  byProvider: Array<{ provider: string; count: number; avgScore: number }>;
  byLanguage: Array<{ language: string; count: number; avgScore: number }>;
};

export type QualityLogEntry = {
  id: string;
  projectId: string;
  translationId: string;
  translationKey: string;
  language: string;
  provider: string | null;
  score: number;
  verdict: string | null;
  source: string;
  aiValue: string;
  referenceValue: string | null;
  notes: string | null;
  createdAt: string;
};
