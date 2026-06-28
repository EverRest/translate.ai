import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.number().default(3600),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  OPENAI_API_KEY: Joi.string().allow('').optional(),
  GEMINI_API_KEY: Joi.string().allow('').optional(),
  ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
  OLLAMA_BASE_URL: Joi.string().default('http://localhost:11434'),
  OLLAMA_MODEL: Joi.string().default('qwen2.5:7b'),
  OLLAMA_MODEL_DEFAULT: Joi.string().default('qwen2.5:7b'),
  OLLAMA_MODEL_FAST: Joi.string().default('llama3.1:8b'),
  OLLAMA_MODEL_LITERAL: Joi.string().default('llama3.1:8b'),
  OLLAMA_ROUTING_MODE: Joi.string()
    .valid('rules', 'classifier', 'rules_then_classifier')
    .default('rules'),
  OLLAMA_CLASSIFIER_MODEL: Joi.string().default('llama3.1:8b'),
  OLLAMA_POLISH_ENABLED: Joi.boolean().default(false),
  OLLAMA_POLISH_MODEL: Joi.string().default('llama3.1:8b'),
  OLLAMA_TIMEOUT_MS: Joi.number().integer().min(30_000).default(600_000),
  OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),
  GEMINI_MODEL: Joi.string().default('gemini-2.0-flash'),
  GEMINI_MODEL_FALLBACK: Joi.string().allow('').default(''),
  GEMINI_TRANSIENT_RETRIES: Joi.number().integer().min(0).max(5).default(2),
  GEMINI_TRANSIENT_RETRY_DELAY_MS: Joi.number()
    .integer()
    .min(0)
    .max(30_000)
    .default(1000),
  AI_PROVIDER_FALLBACK: Joi.string().default('gemini,ollama'),
  DEFAULT_SOURCE_LANGUAGE: Joi.string().default('en'),
  MOCK_TRANSLATIONS: Joi.boolean().default(false),
  TRANSLATION_VALIDATION_ENABLED: Joi.boolean().default(true),
  TRANSLATION_QA_VALIDATORS_ENABLED: Joi.boolean().default(true),
  EXPORT_ASYNC_THRESHOLD: Joi.number().integer().min(1).default(1000),
  EXPORT_STORAGE_DIR: Joi.string().default('.exports'),
  EXPORT_JOB_TTL_HOURS: Joi.number().integer().min(1).max(168).default(24),
  GLOSSARY_ANALYZE_MIN_TRANSLATIONS: Joi.number().integer().min(1).default(100),
  GLOSSARY_ANALYZE_MAX_SUGGESTIONS: Joi.number()
    .integer()
    .min(1)
    .max(500)
    .default(50),
  SEMANTIC_MEMORY_ENABLED: Joi.boolean().default(true),
  SEMANTIC_MEMORY_THRESHOLD: Joi.number().min(0).max(1).default(0.92),
  EMBEDDING_PROVIDER: Joi.string().valid('openai', 'ollama').default('openai'),
  EMBEDDING_DIMENSIONS: Joi.number().integer().min(1).max(3072).default(768),
  OPENAI_EMBEDDING_MODEL: Joi.string().default('text-embedding-3-small'),
  OLLAMA_EMBEDDING_MODEL: Joi.string().default('nomic-embed-text'),
  KNOWLEDGE_CHUNK_SIZE: Joi.number().integer().min(200).max(300).default(250),
  KNOWLEDGE_CHUNK_OVERLAP: Joi.number().integer().min(0).max(100).default(50),
  PROJECT_RAG_ENABLED: Joi.boolean().default(true),
  PROJECT_RAG_TOP_K: Joi.number().integer().min(1).max(10).default(3),
  PROJECT_RAG_MIN_SIMILARITY: Joi.number().min(0).max(1).default(0.75),
  PROJECT_RAG_MAX_CHARS: Joi.number()
    .integer()
    .min(100)
    .max(10000)
    .default(1500),
  ADMIN_EMAIL: Joi.string().email().default('admin@translate.ai'),
  ADMIN_PASSWORD: Joi.string().min(8).default('admin123'),
  ADMIN_TENANT_NAME: Joi.string().default('Default'),
});
