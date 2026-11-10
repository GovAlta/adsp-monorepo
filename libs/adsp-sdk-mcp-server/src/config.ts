export interface McpServerConfig {
  maxInFlight: number;
  inFlightWaitMs: number;
  /** 0 disables the rate limit. */
  rateLimitPerMinute: number;
  liveToolMaxConcurrent: number;
  /** Passed to Express `trust proxy`. */
  trustedProxy: boolean | number | string;
  corsOrigins: '*' | string[];
  shutdownDelayMs: number;
  shutdownTimeoutMs: number;
  /** Required in HTTP mode, where every request signs in; unused over stdio. */
  auth?: HostedAuthConfig;
}

export interface HostedAuthConfig {
  /** This server's external origin, used in sign-in metadata; never taken from request headers. */
  publicUrl: string;
  accessServiceUrl: string;
  directoryServiceUrl: string;
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

const AUTH_SETTINGS = {
  publicUrl: 'MCP_PUBLIC_URL',
  accessServiceUrl: 'ADSP_ACCESS_SERVICE_URL',
  directoryServiceUrl: 'ADSP_DIRECTORY_SERVICE_URL',
} as const;

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost']);

function readUrl(name: string, raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${name} must be an absolute URL, but is "${raw}".`);
  }
  const allowed = url.protocol === 'https:' || (url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname));
  if (!allowed) {
    throw new Error(`${name} must use https (plain http only on 127.0.0.1 or localhost), but is "${raw}".`);
  }
  return raw.replace(/\/+$/, '');
}

function readHostedAuth(env: NodeJS.ProcessEnv): HostedAuthConfig | undefined {
  const entries = Object.entries(AUTH_SETTINGS).map(([key, name]) => [key, name, env[name]?.trim()] as const);
  const missing = entries.filter(([, , value]) => !value).map(([, name]) => name);
  if (missing.length === entries.length) {
    return undefined;
  }
  if (missing.length > 0) {
    throw new Error(`Hosted sign-in needs all of ${Object.values(AUTH_SETTINGS).join(', ')}; missing ${missing.join(', ')}.`);
  }
  return Object.fromEntries(entries.map(([key, name, value]) => [key, readUrl(name, value as string)])) as unknown as HostedAuthConfig;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): McpServerConfig {
  const shutdownDelayMs = readInteger(env, 'MCP_SHUTDOWN_DELAY_MS', 5000, 0);
  const shutdownTimeoutMs = readInteger(env, 'MCP_SHUTDOWN_TIMEOUT_MS', 30000, 1);
  if (shutdownDelayMs >= shutdownTimeoutMs) {
    throw new Error(
      `MCP_SHUTDOWN_DELAY_MS (${shutdownDelayMs}) must be shorter than MCP_SHUTDOWN_TIMEOUT_MS (${shutdownTimeoutMs}).`
    );
  }

  return {
    maxInFlight: readInteger(env, 'MCP_MAX_IN_FLIGHT', 64, 1),
    inFlightWaitMs: readInteger(env, 'MCP_IN_FLIGHT_WAIT_MS', 1000, 0),
    rateLimitPerMinute: readInteger(env, 'MCP_RATE_LIMIT_PER_MINUTE', 1200, 0),
    liveToolMaxConcurrent: readInteger(env, 'MCP_LIVE_TOOL_MAX_CONCURRENT', 8, 1),
    trustedProxy: readTrustedProxy(env),
    corsOrigins: readCorsOrigins(env),
    shutdownDelayMs,
    shutdownTimeoutMs,
  };
}

/** HTTP mode only: stdio users may set ADSP_ACCESS_SERVICE_URL or ADSP_DIRECTORY_SERVICE_URL as adsp-cli overrides. */
export function readHostedConfig(env: NodeJS.ProcessEnv = process.env): McpServerConfig {
  return { ...readConfig(env), auth: readHostedAuth(env) };
}
