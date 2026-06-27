import { ContentType, TranslateOptions } from '../../../ai-provider/domain/ai-provider.interface';
import { inferContentTypeFromContext } from '../../../ai-provider/application/content-classifier.utils';

export const VALID_CONTENT_TYPES: ContentType[] = [
  'ui',
  'email',
  'legal',
  'marketing',
  'article',
  'chat',
  'technical',
  'placeholder',
  'general',
];

export function parseContentType(
  value?: string | null,
): ContentType | undefined {
  if (!value) {
    return undefined;
  }
  if (VALID_CONTENT_TYPES.includes(value as ContentType)) {
    return value as ContentType;
  }
  return undefined;
}

export function resolveContentType(
  stored?: string | null,
  context?: string | null,
  description?: string | null,
): ContentType | undefined {
  return (
    parseContentType(stored) ??
    inferContentTypeFromContext(context ?? undefined) ??
    inferContentTypeFromContext(description ?? undefined)
  );
}

type TranslationKeyContext = {
  description?: string | null;
  context?: string | null;
  contentType?: string | null;
};

type ProjectContext = {
  name: string;
  description?: string | null;
};

export function buildTranslateOptionsFromKey(
  key: TranslationKeyContext,
  project: ProjectContext,
  extras?: Partial<TranslateOptions>,
): TranslateOptions {
  return {
    context: key.context ?? undefined,
    keyDescription: key.description ?? undefined,
    projectName: project.name,
    projectDescription: project.description ?? undefined,
    contentType: resolveContentType(
      key.contentType,
      key.context,
      key.description,
    ),
    ...extras,
  };
}
