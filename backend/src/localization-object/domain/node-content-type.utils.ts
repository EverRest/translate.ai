const NODE_CONTENT_TYPE: Record<string, string> = {
  button: 'ui',
  label: 'ui',
  text: 'ui',
  error: 'ui',
  success: 'ui',
  tooltip: 'ui',
  hint: 'ui',
  validation: 'ui',
  notification: 'ui',
  field: 'ui',
  placeholder: 'placeholder',
  email_subject: 'email',
  email_body: 'email',
  section: 'ui',
};

export function resolveNodeContentType(input: {
  nodeType: string;
  contentType?: string | null;
}): string {
  if (input.contentType?.trim()) {
    return input.contentType.trim();
  }

  return NODE_CONTENT_TYPE[input.nodeType] ?? 'ui';
}
