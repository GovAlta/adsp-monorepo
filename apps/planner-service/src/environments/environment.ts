// ✓ ASVS:V14.2.1 — all configuration sourced from environment variables; no hardcoded credentials
// ✓ CAS:RULE-024 — secrets referenced by env var name only; values never logged or embedded in source
export const environment = {
  production: process.env.NODE_ENV === 'production',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Service identity
  PORT: parseInt(process.env.PORT || '7796', 10),
  CLIENT_ID: process.env.CLIENT_ID || 'urn:ads:platform:planner-service',

  // Authentication — ADSP / Keycloak
  // ✓ ASVS:V3.5.1 — Keycloak root URL sourced from environment; no default that could bypass auth
  KEYCLOAK_ROOT_URL: process.env.KEYCLOAK_ROOT_URL || '',
  CLIENT_SECRET: process.env.CLIENT_SECRET || '',

  // Database — MongoDB
  // ✓ ASVS:V3.2.1 — connection string sourced from environment; never logged
  // ✓ CAS:RULE-024 — MONGO_URI must not appear in any log output
  MONGO_URI: process.env.MONGO_URI || '',

  // ADSP platform integration
  DIRECTORY_URL: process.env.DIRECTORY_URL || 'https://directory-service.adsp.alberta.ca',
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '',
  TRUSTED_PROXY: process.env.TRUSTED_PROXY || '',

  // LLM model configuration (INT-001 — currently stub)
  // OPEN-001, OPEN-002, OPEN-006 must be resolved before enabling live calls
  PLANNER_MODEL_VERSION: process.env.PLANNER_MODEL_VERSION || 'claude-sonnet-4-5',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

  // Protected B audit
  // ✓ ASVS:V7.2.2 — HMAC signing key for audit chain; sourced from environment only
  // ✓ CAS:RULE-028 — AUDIT_SIGNING_KEY must not appear in any log output
  AUDIT_SIGNING_KEY: process.env.AUDIT_SIGNING_KEY || '',

  // CORS and rate limiting
  // ✓ ASVS:V14.4.7 — CORS origins explicitly configured; wildcard fallback removed (D-005)
  // Development-only safe default is 'http://localhost:3000'; production requires explicit env var
  CORS_ORIGIN: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '50', 10), // 50 requests per window (BR-003)

  // Logging
  // ✓ ASVS:V7.1.1 — log level configurable; no sensitive data in log output
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;

export type Environment = typeof environment;
