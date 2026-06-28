import { ProviderTranslateResult } from '../infrastructure/prompt.builder';

export interface AiProvider {
  translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    options?: TranslateOptions,
  ): Promise<ProviderTranslateResult>;
}

export type ContentType =
  | 'ui'
  | 'email'
  | 'legal'
  | 'marketing'
  | 'article'
  | 'chat'
  | 'technical'
  | 'placeholder'
  | 'general';

export interface GlossaryTermOption {
  sourceTerm: string;
  targetTerm?: string | null;
  doNotTranslate: boolean;
}

export interface ReferenceTranslationOption {
  language: string;
  value: string;
}

export interface TranslateOptions {
  context?: string;
  keyDescription?: string;
  projectName?: string;
  projectDescription?: string;
  tone?: 'formal' | 'friendly' | 'technical';
  glossary?: GlossaryTermOption[];
  contentType?: ContentType;
  referenceTranslations?: ReferenceTranslationOption[];
  retryHint?: string;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
