export const DEFAULT_SOURCE_LANGUAGE = 'en';

export interface TranslationCreateJobPayload {
  jobId: string;
  tenantId: string;
  correlationId?: string;
}

export interface TranslationProcessJobPayload {
  jobItemId: string;
  jobId: string;
  tenantId: string;
  correlationId?: string;
  includeReferenceTranslations?: boolean;
}

export interface TranslationRetryJobPayload {
  jobId: string;
  tenantId: string;
}

export interface WebhookSendJobPayload {
  webhookId: string;
  projectId: string;
  tenantId: string;
  event: string;
  eventId: string;
  data: Record<string, unknown>;
  correlationId?: string;
}

export interface TranslationExportJobPayload {
  exportJobId: string;
  tenantId: string;
}

export interface GlossaryAnalyzeJobPayload {
  projectId: string;
  tenantId: string;
}

export interface TranslationEmbedJobPayload {
  tenantId: string;
  memoryId?: string;
  limit?: number;
}
