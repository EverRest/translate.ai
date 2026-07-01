export type ProjectLanguage = {
  id: string;
  projectId: string;
  code: string;
  isDefault: boolean;
};

export type ApiKey = {
  id: string;
  name: string;
  active: boolean;
};

export type ApiKeyCreated = ApiKey & {
  secret: string;
};

export type Webhook = {
  id: string;
  url: string;
  enabled: boolean;
};

export type WebhookCreated = Webhook & {
  secret: string;
};

export type SettingsTab =
  | 'domain'
  | 'consistency'
  | 'languages'
  | 'api-keys'
  | 'webhooks'
  | 'integrations';
