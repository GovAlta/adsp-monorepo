export type AccessEnvironmentId = 'dev' | 'uat' | 'prod' | 'local';

export interface AccessEnvironment {
  id: AccessEnvironmentId;
  label: string;
  host: string;
  readOnly: boolean;
}

/**
 * Known Access Service (Keycloak) environments. The agent only ever reads from these, so every
 * environment is read-only; Production in particular must never be changed.
 */
export const ACCESS_ENVIRONMENTS: readonly AccessEnvironment[] = Object.freeze([
  { id: 'dev', label: 'Development', host: 'https://access.adsp-dev.gov.ab.ca', readOnly: true },
  { id: 'uat', label: 'UAT', host: 'https://access-uat.alberta.ca', readOnly: true },
  { id: 'prod', label: 'Production', host: 'https://access.alberta.ca', readOnly: true },
]);

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Returns the known environments, plus a Local environment when this deployment's Keycloak is on a
 * loopback host so the discovery tools can be tested locally.
 */
export function getAccessEnvironments(accessServiceUrl: URL): AccessEnvironment[] {
  const environments = [...ACCESS_ENVIRONMENTS];
  if (LOOPBACK_HOSTNAMES.has(accessServiceUrl.hostname)) {
    environments.push({ id: 'local', label: 'Local', host: accessServiceUrl.origin, readOnly: true });
  }

  return environments;
}

export function findAccessEnvironmentByOrigin(
  environments: AccessEnvironment[],
  origin: string,
): AccessEnvironment | undefined {
  return environments.find((environment) => new URL(environment.host).origin === origin);
}
