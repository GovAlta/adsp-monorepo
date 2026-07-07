import { getServiceUrls } from './directory';
import { HttpRequestError } from './httpError';

const TENANT_SERVICE_URN = 'urn:ads:platform:tenant-service:v2';

export interface Tenant {
  name: string;
  realm: string;
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
