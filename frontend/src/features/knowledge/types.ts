export type KnowledgeSourceType = 'text' | 'markdown' | 'file';

export type KnowledgeSourceStatus = 'pending' | 'ready' | 'failed';

export type KnowledgeSource = {
  id: string;
  name: string;
  sourceType: KnowledgeSourceType;
  status: KnowledgeSourceStatus;
  originalFilename: string | null;
  byteSize: number;
  chunkCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateKnowledgeSourceInput = {
  name: string;
  sourceType: KnowledgeSourceType;
  content: string;
  originalFilename?: string;
};

export type CreateKnowledgeSourceResult = {
  source: KnowledgeSource;
  queued: boolean;
};
