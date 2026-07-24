import { getServiceUrls } from './directory';
import { HttpRequestError } from './httpError';

const TENANT_SERVICE_URN = 'urn:ads:platform:tenant-service:v2';

export interface Tenant {
  id?: string;
  name: string;
  realm: string;
  adminEmail?: string;
  status?: string;
}

interface TenantsResponse {
  results: Tenant[];
}

async function resolveTenantServiceUrl(directoryServiceUrl: string): Promise<string> {
  const serviceUrls = await getServiceUrls(directoryServiceUrl);
  const url = serviceUrls[TENANT_SERVICE_URN];
  if (!url) {
    throw new Error(`${TENANT_SERVICE_URN} was not found in the directory for the configured environment.`);
  }
  return url;
}

/**
 * Anonymous lookup of a tenant by exact name — tenant-service's name-filtered list endpoint
 * doesn't require authentication.
 */
export async function findTenantByName(directoryServiceUrl: string, name: string): Promise<Tenant | null> {
  const tenantServiceUrl = await resolveTenantServiceUrl(directoryServiceUrl);
  const url = new URL('v2/tenants', tenantServiceUrl);
  url.searchParams.set('name', name);

  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpRequestError(response.status, `Tenant service request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as TenantsResponse;
  return data.results?.[0] ?? null;
}

/**
 * Anonymous reverse lookup of a tenant by realm — the exact-name lookup's realm-keyed
 * counterpart, for resolving a display name when only the realm is known (e.g. `login --realm`).
 */
export async function findTenantByRealm(directoryServiceUrl: string, realm: string): Promise<Tenant | null> {
  const tenantServiceUrl = await resolveTenantServiceUrl(directoryServiceUrl);
  const url = new URL('v2/tenants', tenantServiceUrl);
  url.searchParams.set('realm', realm);

  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpRequestError(response.status, `Tenant service request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as TenantsResponse;
  return data.results?.[0] ?? null;
}

/**
 * Full tenant list — requires an authenticated (core-realm) token. Used for the interactive
 * tenant-picker flow when the caller doesn't already know their tenant name or realm.
 */
export async function listTenants(directoryServiceUrl: string, accessToken: string): Promise<Tenant[]> {
  const tenantServiceUrl = await resolveTenantServiceUrl(directoryServiceUrl);
  const url = new URL('v2/tenants', tenantServiceUrl);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new HttpRequestError(response.status, `Tenant service request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as TenantsResponse;
  return data.results ?? [];
}

/**
 * tenant-service's role guard (`requireBetaTesterOrAdmin`) rejects a caller lacking the
 * beta-tester/tenant-service-admin role with a bare 401 and no body, so that case needs its own
 * message; other failures (name validation, one-tenant-per-email) come back as
 * `{ errorMessage: string }` from the shared core-common error handler.
 */
async function extractErrorMessage(response: Response): Promise<string> {
  if (response.status === 401) {
    return "Your account doesn't have permission to create a tenant. Ask the ADSP team to grant your account the 'beta-tester' role, then try again.";
  }
  try {
    const body = (await response.json()) as { errorMessage?: string };
    return body.errorMessage ?? `Tenant service request failed with status ${response.status}.`;
  } catch {
    return `Tenant service request failed with status ${response.status}.`;
  }
}

/**
 * Creates a new tenant — requires an authenticated core-realm token with the beta-tester or
 * tenant-service-admin role. Returns immediately once the tenant record is created (status
 * 'provisioning'); the Keycloak realm itself is provisioned asynchronously — see
 * waitForTenantActive.
 */
export async function createTenant(directoryServiceUrl: string, accessToken: string, name: string): Promise<Tenant> {
  const tenantServiceUrl = await resolveTenantServiceUrl(directoryServiceUrl);
  const url = new URL('v2/tenants', tenantServiceUrl);

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new HttpRequestError(response.status, await extractErrorMessage(response));
  }

  return (await response.json()) as Tenant;
}

/** Tenant ids are returned as a full URN (`urn:ads:platform:tenant-service:v2:/tenants/<id>`) — this pulls the raw id back out. */
function extractTenantId(urn: string): string {
  return urn.substring(urn.lastIndexOf('/') + 1);
}

/**
 * Authenticated point lookup of a tenant by id — a much cheaper read than the name/realm-filtered
 * list queries (a direct lookup by primary key vs. a filtered scan), so this is what polling
 * should use. Returns null on a 404 (the tenant was rolled back after a provisioning failure, per
 * tenant-service's getTenant handler); throws on any other non-ok response.
 */
export async function getTenantById(directoryServiceUrl: string, accessToken: string, id: string): Promise<Tenant | null> {
  const tenantServiceUrl = await resolveTenantServiceUrl(directoryServiceUrl);
  const url = new URL(`v2/tenants/${encodeURIComponent(id)}`, tenantServiceUrl);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new HttpRequestError(response.status, await extractErrorMessage(response));
  }

  return (await response.json()) as Tenant;
}

/**
 * Polls the newly created tenant by id (see getTenantById) until its realm finishes provisioning.
 * Throws if the tenant disappears (provisioning failed and the record was rolled back) or if
 * provisioning takes longer than timeoutMs.
 */
export async function waitForTenantActive(
  directoryServiceUrl: string,
  accessToken: string,
  tenant: Tenant,
  { intervalMs = 3000, timeoutMs = 120_000 } = {}
): Promise<Tenant> {
  const id = extractTenantId(tenant.id);
  const deadline = Date.now() + timeoutMs;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = await getTenantById(directoryServiceUrl, accessToken, id);
    if (!found) {
      throw new Error(`Tenant '${tenant.name}' provisioning failed. Contact the ADSP team and try again.`);
    }
    if (found.status === 'active') {
      return found;
    }
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for tenant '${tenant.name}' to finish provisioning.`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
