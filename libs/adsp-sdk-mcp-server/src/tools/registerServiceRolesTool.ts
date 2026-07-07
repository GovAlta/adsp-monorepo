import {
  getAccessToken,
  getDirectoryServiceUrl,
  getServiceRoles,
  HttpRequestError,
  ServiceNotInDirectoryError,
} from '@abgov/adsp-cli';
import { LiveToolDefinition } from './types';

function describeError(err: unknown): string {
  if (err instanceof ServiceNotInDirectoryError) {
    return err.message;
  }

  if (err instanceof HttpRequestError) {
    if (err.status === 401) {
      return 'Access token was rejected (401). Run `npx @abgov/adsp-cli login` again to refresh it.';
    }
    if (err.status === 403) {
      return (
        'Access denied (403) reading tenant-service configuration. This is more likely the wrong tenant realm ' +
        'or environment than a missing role — check ADSP_TENANT_REALM and ADSP_ENV.'
      );
    }
    if (err.status >= 500) {
      return `The ADSP platform returned an error (${err.status}). It may be experiencing an outage — try again shortly.`;
    }
    return `Request failed with status ${err.status}.`;
  }

  if (err instanceof TypeError) {
    return `Could not reach the ADSP platform (${err.message}). Check ADSP_ENV/ADSP_DIRECTORY_SERVICE_URL and your network connection.`;
  }

  return err instanceof Error ? err.message : String(err);
}

export function createServiceRolesTools(): LiveToolDefinition[] {
  return [
    {
      name: 'list_service_roles',
      description:
        'List every ADSP platform service\'s registered RBAC role (role name, description, whether it is part of ' +
        'the tenant-admin composite role), read live from tenant-service configuration. Use this to pick the ' +
        'least-privileged role for a service account or user, rather than defaulting to an admin role. Requires ' +
        'login: run `npx @abgov/adsp-cli login` once in a terminal first (no other setup needed).',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        const tokenResult = await getAccessToken();

        if (tokenResult.status === 'not-authenticated') {
          return {
            isError: true,
            content: [
              { type: 'text', text: 'Not authenticated. Run `npx @abgov/adsp-cli login` in a terminal, then retry.' },
            ],
          };
        }

        try {
          const directoryServiceUrl = getDirectoryServiceUrl();
          const roles = await getServiceRoles(tokenResult.token, directoryServiceUrl);
          return { content: [{ type: 'text', text: JSON.stringify(roles, null, 2) }] };
        } catch (err) {
          return { isError: true, content: [{ type: 'text', text: describeError(err) }] };
        }
      },
    },
  ];
}
