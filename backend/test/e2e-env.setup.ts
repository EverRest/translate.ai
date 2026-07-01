/**
 * Runs before e2e spec imports (via jest setupFiles).
 * Must not live inside spec files: imports are hoisted above inline process.env assignments.
 */
process.env.MOCK_TRANSLATIONS = 'true';
process.env.NODE_ENV = 'test';
process.env.BULLMQ_PREFIX = `e2e-${process.pid}`;
process.env.IMPORT_ASYNC_THRESHOLD = '10000';
process.env.ATLASSIAN_CLIENT_ID = 'e2e-test-client-id';
process.env.ATLASSIAN_CLIENT_SECRET = 'e2e-test-client-secret';
process.env.ATLASSIAN_REDIRECT_URI =
  'http://localhost:3000/api/v1/integrations/confluence/oauth/callback';
