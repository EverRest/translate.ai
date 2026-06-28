export type MemoryCacheSummary = {
  totalHits: number;
  memoryHitExact: number;
  memoryHitSemantic: number;
  llmCalls: number;
  exactHitRate: number;
  semanticHitRate: number;
  combinedHitRate: number;
  timeline: Array<{ date: string; exact: number; semantic: number }>;
};

export type UsageBreakdownRow = {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
};

export type UsageSummary = {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  fallbackCount: number;
  byProvider: Array<UsageBreakdownRow & { provider: string }>;
  byModel: Array<UsageBreakdownRow & { model: string }>;
  byUser: Array<
    UsageBreakdownRow & {
      userId: string | null;
      userEmail: string;
    }
  >;
};

export type UsageTimeline = {
  days: number;
  points: Array<{
    date: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  }>;
};

export type UsageLogEntry = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  projectId: string | null;
  jobId: string | null;
  jobItemId: string | null;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  usedFallback: boolean;
  primaryProvider: string | null;
  createdAt: string;
};

export type AccountUsage = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    planStatus: string;
    subscriptionSince: string;
    monthlyTokenQuota: number | null;
  };
  lifetime: UsageSummary;
  thisMonth: UsageSummary;
  quotaUsedPercent: number | null;
  timeline: UsageTimeline;
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
