import { resolveEnvironmentUrls } from './environments';
import { HttpRequestError } from './httpError';

interface DirectoryEntry {
  urn: string;
  url: string;
}

/**
 * Resolves the current environment's directory-service URL (ADSP_ENV / ADSP_DIRECTORY_SERVICE_URL).
 * Independent of ADSP_TENANT_REALM — works even when a caller is using the ADSP_ACCESS_TOKEN escape
 * hatch and never logs in.
 */
export function getDirectoryServiceUrl(): string {
  return resolveEnvironmentUrls().directoryServiceUrl;
}

/**
 * Looks up all platform service URLs registered in the directory. Generic building block —
 * takes an explicit directoryServiceUrl rather than resolving one itself, so it stays usable
 * against any directory, not just the current environment's.
 */
export async function getServiceUrls(directoryServiceUrl: string): Promise<Record<string, string>> {
  const url = new URL('/directory/v2/namespaces/platform/entries', directoryServiceUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpRequestError(response.status, `Directory service request failed with status ${response.status}.`);
  }

  const entries = (await response.json()) as DirectoryEntry[];
  return entries.reduce<Record<string, string>>((urls, { urn, url: serviceUrl }) => ({ ...urls, [urn]: serviceUrl }), {});
}

/**
 * Registers a service entry in the directory under the given tenant namespace. Returns 'registered'
 * on success or 'exists' if the entry is already present (no overwrite — register-once semantics).
 * Requires a token with the directory-admin role on the namespace's tenant.
 */
export async function registerDirectoryService(
  directoryServiceUrl: string,
  namespace: string,
  service: string,
  url: string,
  accessToken: string
): Promise<'registered' | 'exists'> {
  const endpoint = new URL(`/directory/v2/namespaces/${encodeURIComponent(namespace)}/services`, directoryServiceUrl);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ service, url }),
  });

  if (response.status === 409) {
    return 'exists';
  }

  if (!response.ok) {
    let message = `Directory service request failed with status ${response.status}.`;
    if (response.status === 403) {
      message =
        `Not authorized to register services in namespace '${namespace}'. ` +
        `Ensure your account has the 'directory-admin' role for this tenant.`;
    }
    throw new HttpRequestError(response.status, message);
  }

  return 'registered';
}
