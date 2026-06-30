export const CONTENT_TYPE_OPTIONS = [
  { value: '', label: 'Auto-detect from context' },
  { value: 'ui', label: 'Form button / UI label' },
  { value: 'placeholder', label: 'Placeholder' },
  { value: 'email', label: 'Email' },
  { value: 'article', label: 'Article / long text' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'legal', label: 'Legal' },
  { value: 'chat', label: 'Chat / message' },
  { value: 'technical', label: 'Technical' },
  { value: 'general', label: 'General' },
] as const;

export type ContentType = (typeof CONTENT_TYPE_OPTIONS)[number]['value'];

export function contentTypeLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Auto';
  }
  return (
    CONTENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}
