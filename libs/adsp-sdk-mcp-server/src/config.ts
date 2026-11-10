export interface McpServerConfig {
  maxInFlight: number;
  inFlightWaitMs: number;
  /** 0 disables the rate limit. */
  rateLimitPerMinute: number;
  liveToolMaxConcurrent: number;
  /** Passed to Express `trust proxy`. */
  trustedProxy: boolean | number | string;
  corsOrigins: '*' | string[];
}

function readInteger(env: NodeJS.ProcessEnv, name: string, defaultValue: number, minimum: number): number {
  const raw = env[name]?.trim();
  if (!raw) {
    return defaultValue;
  }
  if (!/^\d+$/.test(raw) || Number(raw) < minimum) {
    throw new Error(`${name} must be an integer of at least ${minimum}, but is "${raw}".`);
  }
  return Number(raw);
}

function readTrustedProxy(env: NodeJS.ProcessEnv): McpServerConfig['trustedProxy'] {
  const raw = env['TRUSTED_PROXY']?.trim();
  if (!raw) {
    return 'uniquelocal';
  }
  if (raw === 'true' || raw === 'false') {
    return raw === 'true';
  }
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}

function readCorsOrigins(env: NodeJS.ProcessEnv): McpServerConfig['corsOrigins'] {
  const origins = (env['CORS_ORIGIN'] ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (!origins.includes('*')) {
    return origins;
  }
  if (origins.length > 1) {
    throw new Error('CORS_ORIGIN must be either * or a list of origins, not both.');
  }
  return '*';
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): McpServerConfig {
  return {
    maxInFlight: readInteger(env, 'MCP_MAX_IN_FLIGHT', 64, 1),
    inFlightWaitMs: readInteger(env, 'MCP_IN_FLIGHT_WAIT_MS', 1000, 0),
    rateLimitPerMinute: readInteger(env, 'MCP_RATE_LIMIT_PER_MINUTE', 1200, 0),
    liveToolMaxConcurrent: readInteger(env, 'MCP_LIVE_TOOL_MAX_CONCURRENT', 8, 1),
    trustedProxy: readTrustedProxy(env),
    corsOrigins: readCorsOrigins(env),
  };
}
