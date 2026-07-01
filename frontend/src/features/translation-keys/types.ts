export type TranslationKey = {
  id: string;
  projectId: string;
  key: string;
  sourceText: string;
  description: string | null;
  context: string | null;
  contentType: string | null;
};

export type CreateTranslationKeyInput = {
  key: string;
  sourceText: string;
  description?: string;
  context?: string;
  contentType?: string;
};

export type UpdateTranslationKeyInput = {
  description?: string;
  context?: string;
  contentType?: string | null;
  sourceText?: string;
};
