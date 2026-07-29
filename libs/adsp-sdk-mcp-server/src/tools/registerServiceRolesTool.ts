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

const SERVICE_ROLES_PREAMBLE = `## How to use these roles

This list covers every ADSP platform service. For each service your service needs to call, complete
**both** of the following Keycloak steps — one without the other is not enough:

1. **Add an audience mapper** on your service's client so its tokens carry the target service's URN in the
   \`aud\` claim (target services reject tokens that don't include their URN):
   Keycloak admin → Clients → {your-client-id} → Client Scopes → {your-client-id}-dedicated →
   Add mapper → By configuration → Audience → set "Included Client Audience" to the \`serviceId\`
   (e.g. \`urn:ads:platform:file-service\`).

2. **Assign the role** to your service account:
   Keycloak admin → Clients → {your-client-id} → Service Account Roles → Client Roles →
   select \`serviceId\` from the dropdown → assign the role.

Roles where \`inTenantAdmin: true\` are automatically granted to tenant admin users, but service accounts
always need explicit assignment regardless of that flag.

---

`;

export function createServiceRolesTools(): LiveToolDefinition[] {
  return [
    {
      name: 'list_service_roles',
      description:
        'List every ADSP platform service\'s registered RBAC role (role name, description, whether it is ' +
        'part of the tenant-admin composite role), read live from tenant-service configuration. Use this to ' +
        'identify the least-privileged role when your service needs to call another ADSP service. After ' +
        'identifying the role, two Keycloak steps are required: (1) add an audience mapper for the service\'s ' +
        'URN on your client, and (2) assign the role to your service account — both are needed. Requires ' +
        'authentication: run `npx @abgov/adsp-cli login` once in a terminal (interactive), or set ' +
        'ADSP_CLIENT_ID and ADSP_CLIENT_SECRET environment variables for non-interactive/CI use.',
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
          return {
            content: [{ type: 'text', text: SERVICE_ROLES_PREAMBLE + JSON.stringify(roles, null, 2) }],
          };
        } catch (err) {
          return { isError: true, content: [{ type: 'text', text: describeError(err) }] };
        }
      },
    },
  ];
}
