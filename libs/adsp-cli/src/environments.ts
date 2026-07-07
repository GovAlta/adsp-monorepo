import { readConfig } from './config';

export type EnvironmentName = 'dev' | 'test' | 'prod';

export interface EnvironmentUrls {
  accessServiceUrl: string;
  directoryServiceUrl: string;
}

const environments: Record<EnvironmentName, EnvironmentUrls> = {
  dev: {
    accessServiceUrl: 'https://access.adsp-dev.gov.ab.ca',
    directoryServiceUrl: 'https://directory-service.adsp-dev.gov.ab.ca',
  },
  test: {
    accessServiceUrl: 'https://access-uat.alberta.ca',
    directoryServiceUrl: 'https://directory-service.adsp-uat.alberta.ca',
  },
  prod: {
    accessServiceUrl: 'https://access.alberta.ca',
    directoryServiceUrl: 'https://directory-service.adsp.alberta.ca',
  },
};

/**
 * Resolves which environment preset to use: an explicit override (only ever passed by
 * loginInteractive, for a --env arg) if given, else ADSP_ENV if set to a recognized value, else the
 * environment persisted by the last `adsp login --env` (~/.adsp-cli/config.json), else 'prod'.
 */
export function resolveEnvironmentName(explicitEnv?: EnvironmentName): EnvironmentName {
  if (explicitEnv) {
    return explicitEnv;
  }

  const raw = process.env.ADSP_ENV;
  if (raw === 'dev' || raw === 'test' || raw === 'prod') {
    return raw;
  }

  return readConfig()?.env ?? 'prod';
}

/**
 * Resolves environment URLs plus URL-override env vars. Deliberately independent of
 * ADSP_TENANT_REALM — these URLs don't depend on which realm is used, and callers using the
 * ADSP_ACCESS_TOKEN escape hatch (which skips realm/login entirely) still need to resolve them.
 */
export function resolveEnvironmentUrls(explicitEnv?: EnvironmentName): EnvironmentUrls {
  const preset = environments[resolveEnvironmentName(explicitEnv)];
  return {
    accessServiceUrl: process.env.ADSP_ACCESS_SERVICE_URL ?? preset.accessServiceUrl,
    directoryServiceUrl: process.env.ADSP_DIRECTORY_SERVICE_URL ?? preset.directoryServiceUrl,
  };
}

export type TenantRealmResolution = { ok: true; tenantRealm: string } | { ok: false; missingEnvVar: string };

/**
 * Resolves the tenant realm to use: the ADSP_TENANT_REALM env var (an override, e.g. for CI or
 * multiple contexts) if set, else the realm persisted by the last `adsp login` (~/.adsp-cli/config.json).
 * Only required for the login/cache flow (a realm is meaningless without it) — not for URL
 * resolution, which resolveEnvironmentUrls() handles independently.
 */
export function resolveTenantRealm(): TenantRealmResolution {
  const envRealm = process.env.ADSP_TENANT_REALM;
  if (envRealm) {
    return { ok: true, tenantRealm: envRealm };
  }

  const config = readConfig();
  if (config?.tenantRealm) {
    return { ok: true, tenantRealm: config.tenantRealm };
  }

  return { ok: false, missingEnvVar: 'ADSP_TENANT_REALM' };
}
