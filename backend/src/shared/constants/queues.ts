export const QUEUES = {
  TRANSLATION_CREATE: 'translation.create',
  TRANSLATION_PROCESS: 'translation.process',
  TRANSLATION_RETRY: 'translation.retry',
  TRANSLATION_REVIEW: 'translation.review',
  TRANSLATION_EXPORT: 'translation.export',
  GLOSSARY_ANALYZE: 'glossary.analyze',
  TERMINOLOGY_SCAN: 'terminology.scan',
  LOCALIZATION_OBJECT_GENERATE: 'localization-object.generate',
  INTEGRATION_OPENAPI_IMPORT: 'integration.openapi.import',
  INTEGRATION_IMPORT_PARSE: 'integration.import.parse',
  INTEGRATION_IMPORT_APPLY: 'integration.import.apply',
  INTEGRATION_EXCEL_PARSE: 'integration.excel.parse',
  INTEGRATION_EXCEL_COMPOSE: 'integration.excel.compose',
  INTEGRATION_CONFLUENCE_SYNC: 'integration.confluence.sync',
  WEBHOOK_SEND: 'webhook.send',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
