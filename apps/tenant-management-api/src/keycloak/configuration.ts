import { AdspId, ServiceRole } from '@abgov/adsp-service-sdk';
import type ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import type ClientScopeRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientScopeRepresentation';
import type RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../environments/environment';

export const createPlatformServiceConfig = (
  serviceId: AdspId,
  ...roles: ServiceRole[]
): { client: ClientRepresentation; clientRoles: RoleRepresentation[] } => {
  const client: ClientRepresentation = {
    id: uuidv4(),
    clientId: serviceId.toString(),
    description: `Bearer client containing roles for access to ${serviceId.service}`,
    bearerOnly: true,
    publicClient: false,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: false,
    standardFlowEnabled: false,
  };

  const clientRoles: RoleRepresentation[] = roles.map((r) => ({
    name: r.role,
    description: r.description,
  }));

  return {
    client,
    clientRoles,
  };
};

export const createWebappClientConfig = (id: string): ClientRepresentation => {
  const config: ClientRepresentation = {
    id,
    clientId: environment.TENANT_WEB_APP_CLIENT_ID,
    publicClient: true,
    directAccessGrantsEnabled: false,
    redirectUris: [`${environment.TENANT_WEB_APP_HOST}/*`],
    webOrigins: [environment.TENANT_WEB_APP_HOST],
    description: 'Client created by platform team to support the frontend. Please do not delete it',
    protocolMappers: [
      {
        name: 'tenant-service-aud',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-audience-mapper',
        config: {
          'included.client.audience': 'urn:ads:platform:tenant-service',
          'id.token.claim': 'false',
          'access.token.claim': 'true',
        },
      },
    ],
  };

  return config;
};

export const createSubscriberAppPublicClientConfig = (id: string): ClientRepresentation => {
  const config: ClientRepresentation = {
    id,
    clientId: environment.SUBSCRIBER_APP_CLIENT_ID,
    publicClient: true,
    directAccessGrantsEnabled: false,
    redirectUris: [`${environment.SUBSCRIBER_APP_HOST}/*`],
    webOrigins: [environment.SUBSCRIBER_APP_HOST],
    description: 'Client created by platform team to support the subscriber app. Please do not delete it',
  };

  return config;
};

export const createApiAppPublicClientConfig = (id: string): ClientRepresentation => {
  const config: ClientRepresentation = {
    id,
    clientId: 'api-app-client',
    enabled: false,
    publicClient: true,
    directAccessGrantsEnabled: false,
    redirectUris: [`${environment.API_APP_HOST}/*`],
    webOrigins: [environment.API_APP_HOST],
    description:
      'Platform configured client for ADSP API site. Enable for easy authorization via openId (OAuth2, authorization_code) from the ADSP API site',
  };

  return config;
};

export const ADSP_CLI_ADMIN_CLIENT_SCOPE_NAME = 'adsp-cli-admin';

export const createAdspCliPublicClientConfig = (id: string): ClientRepresentation => {
  const config: ClientRepresentation = {
    id,
    clientId: 'adsp-cli',
    enabled: true,
    publicClient: true,
    standardFlowEnabled: true,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: false,
    serviceAccountsEnabled: false,
    consentRequired: true,
    fullScopeAllowed: false,
    attributes: {
      'pkce.code.challenge.method': 'S256',
    },
    redirectUris: ['http://localhost:3000/callback'],
    webOrigins: ['http://localhost:3000'],
    // Keycloak's client `description` column is capped at 255 chars — keep this short; the full rationale
    // lives in ADSP_CLI_CLIENT_SCOPE_MAPPINGS's doc comment and libs/adsp-cli/README.md, not here.
    description:
      'Public client for @abgov/adsp-cli and @abgov/nx-adsp. PKCE-only, consent required. Scope restricted to ' +
      'configuration-admin/agent-user via clientScopeMappings in keycloak.ts; optional adsp-cli-admin scope is ' +
      'for nx-adsp provisioning use only.',
  };

  return config;
};

/**
 * The OIDC scope object itself — not granted by default (see optionalClientScopes above), only included in a
 * token when a login request explicitly asks for it (scope=... adsp-cli-admin), with its own consent-screen line.
 * Requesting it doesn't grant manage-clients/manage-users to a user who doesn't already have them — it only makes
 * an existing grant visible/usable through this client. ClientScopeRepresentation has no field for role scope
 * mappings; that's wired up separately in keycloak.ts's grantAdspCliAdminScopeMapping after realm creation.
 */
export const createAdspCliAdminClientScopeConfig = (): ClientScopeRepresentation => ({
  name: ADSP_CLI_ADMIN_CLIENT_SCOPE_NAME,
  protocol: 'openid-connect',
  // Keycloak attribute values are also length-limited — keep consent.screen.text short (it's shown to end
  // users verbatim), full rationale is in this function's own doc comment above.
  attributes: {
    'display.on.consent.screen': 'true',
    'consent.screen.text':
      'Manage OAuth clients and role assignments in this realm. Used by @abgov/nx-adsp to register new ' +
      "services' Keycloak clients. Only takes effect if you already have Keycloak realm-management rights.",
    'include.in.token.scope': 'true',
  },
});

/**
 * The roles adsp-cli's human users are expected to already have:
 * - configuration-admin, bundled into the tenant-admin composite. ConfigurationEntity.canAccess()
 *   (apps/configuration-service/src/configuration/model/configuration.ts) also accepts configuration-reader/
 *   configured-service (configuration-service's own roles) and directory-service's resource-resolver /
 *   export-service's export-job — but those last four exist for OTHER platform services' own machine/
 *   service-account callers reading configuration for their own purposes, not for a human logging in via
 *   adsp-cli's browser flow. adsp-cli never calls export-service at all, and its one directory-service call
 *   (getServiceUrls) is unauthenticated (no Bearer token, see directory.ts) — so scope-mapping those roles would
 *   grant nothing this client ever uses.
 * - agent-user on agent-service — required by @abgov/nx-adsp's "consult the ADSP agent" generator feature
 *   (apps/agent-service/src/agent/router.ts's onIoConnection socket-connection gate); adsp-cli itself doesn't use
 *   agent-service, this is here for that shared-client consumer.
 * Used as the adsp-cli client's clientScopeMappings in keycloak.ts so its tokens can only ever carry these two
 * roles, never the rest of a user's role set.
 */
export const ADSP_CLI_CLIENT_SCOPE_MAPPINGS = [
  { client: 'urn:ads:platform:configuration-service', roles: ['configuration-admin'] },
  { client: 'urn:ads:platform:agent-service', roles: ['agent-user'] },
];
