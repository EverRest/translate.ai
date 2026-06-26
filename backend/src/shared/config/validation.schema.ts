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
  AI_PROVIDER_FALLBACK: Joi.string().default('gemini,ollama'),
  DEFAULT_SOURCE_LANGUAGE: Joi.string().default('en'),
  MOCK_TRANSLATIONS: Joi.boolean().default(false),
  ADMIN_EMAIL: Joi.string().email().default('admin@translate.ai'),
  ADMIN_PASSWORD: Joi.string().min(8).default('admin123'),
  ADMIN_TENANT_NAME: Joi.string().default('Default'),
});
