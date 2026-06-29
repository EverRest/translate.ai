export type LocalizationTemplateType =
  | 'form'
  | 'page'
  | 'modal'
  | 'email'
  | 'api'
  | 'custom';

export type LocalizationObjectStatus = 'draft' | 'materialized';

export type LocalizationObjectGenerationStatus =
  | 'idle'
  | 'queued'
  | 'generating'
  | 'completed'
  | 'failed';

export type LocalizationNodeType =
  | 'section'
  | 'field'
  | 'button'
  | 'label'
  | 'placeholder'
  | 'hint'
  | 'validation'
  | 'error'
  | 'success'
  | 'tooltip'
  | 'email_subject'
  | 'email_body'
  | 'notification'
  | 'text';

export type LocalizationObjectSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  templateType: LocalizationTemplateType;
  status: LocalizationObjectStatus;
  generationStatus: LocalizationObjectGenerationStatus;
  generationError: string | null;
  nodeCount: number;
  materializedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type LocalizationNode = {
  id: string;
  parentId: string | null;
  sortOrder: number;
  slug: string;
  nodeType: LocalizationNodeType;
  label: string | null;
  sourceText: string | null;
  description: string | null;
  context: string | null;
  contentType: string | null;
  translationKeyId: string | null;
  children?: LocalizationNode[];
};

export type LocalizationObjectDetail = LocalizationObjectSummary & {
  tree: LocalizationNode[];
};

export type CreateLocalizationObjectInput = {
  name: string;
  slug: string;
  description?: string;
  templateType?: LocalizationTemplateType;
};

export type CreateLocalizationNodeInput = {
  slug: string;
  nodeType: LocalizationNodeType;
  parentId?: string;
  sortOrder?: number;
  label?: string;
  sourceText?: string;
  description?: string;
  context?: string;
  contentType?: string;
};

export type UpdateLocalizationNodeInput = {
  sortOrder?: number;
  label?: string | null;
  sourceText?: string | null;
  description?: string | null;
  context?: string | null;
  contentType?: string | null;
  nodeType?: LocalizationNodeType;
};

export type MaterializeResult = {
  created: number;
  updated: number;
  total: number;
};

export type ObjectTemplateSummary = {
  id: string;
  name: string;
  description: string;
  templateType: LocalizationTemplateType;
};

export const NODE_TYPE_OPTIONS: {
  value: LocalizationNodeType;
  label: string;
  group: string;
}[] = [
  { value: 'section', label: 'Section', group: 'Structure' },
  { value: 'field', label: 'Field', group: 'Structure' },
  { value: 'label', label: 'Label', group: 'Copy' },
  { value: 'text', label: 'Text', group: 'Copy' },
  { value: 'button', label: 'Button', group: 'Copy' },
  { value: 'placeholder', label: 'Placeholder', group: 'Copy' },
  { value: 'hint', label: 'Hint', group: 'Copy' },
  { value: 'tooltip', label: 'Tooltip', group: 'Copy' },
  { value: 'error', label: 'Error', group: 'Validation' },
  { value: 'validation', label: 'Validation', group: 'Validation' },
  { value: 'success', label: 'Success', group: 'Validation' },
  { value: 'notification', label: 'Notification', group: 'Copy' },
  { value: 'email_subject', label: 'Email subject', group: 'Email' },
  { value: 'email_body', label: 'Email body', group: 'Email' },
];

export const TEMPLATE_TYPE_OPTIONS: {
  value: LocalizationTemplateType;
  label: string;
}[] = [
  { value: 'form', label: 'Form' },
  { value: 'page', label: 'Page' },
  { value: 'modal', label: 'Modal' },
  { value: 'email', label: 'Email' },
  { value: 'api', label: 'API' },
  { value: 'custom', label: 'Custom' },
];
