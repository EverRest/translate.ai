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
  | 'general';

export interface GlossaryTermOption {
  sourceTerm: string;
  targetTerm?: string | null;
  doNotTranslate: boolean;
}

export interface TranslateOptions {
  context?: string;
  tone?: 'formal' | 'friendly' | 'technical';
  glossary?: GlossaryTermOption[];
  contentType?: ContentType;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
