/**
 * Runs before e2e spec imports (via jest setupFiles).
 * Must not live inside spec files: imports are hoisted above inline process.env assignments.
 */
process.env.MOCK_TRANSLATIONS = 'true';
process.env.NODE_ENV = 'test';
process.env.BULLMQ_PREFIX = `e2e-${process.pid}`;
process.env.IMPORT_ASYNC_THRESHOLD = '10000';
