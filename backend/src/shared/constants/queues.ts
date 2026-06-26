export const QUEUES = {
  TRANSLATION_CREATE: 'translation.create',
  TRANSLATION_PROCESS: 'translation.process',
  TRANSLATION_RETRY: 'translation.retry',
  TRANSLATION_REVIEW: 'translation.review',
  TRANSLATION_EXPORT: 'translation.export',
  WEBHOOK_SEND: 'webhook.send',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
