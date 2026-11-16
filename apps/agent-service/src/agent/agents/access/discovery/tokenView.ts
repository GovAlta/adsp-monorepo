import z from 'zod';
import type { KeycloakRepresentation } from './adminRead';
import type { AccessClientDetails } from './clientView';
import { asRecord, optionalString, stringList } from './values';

/**
 * Preview of what an access token from a client would carry, built from Keycloak's example token claims. Only
 * troubleshooting fields are copied: issuer, audience, authorized party, scopes, roles, lifetime and allowed origins.
 * Other claims are listed by name only, so values such as email, names and the subject are never returned, and no
 * token string exists to leak because Keycloak returns the claims without signing a token.
 */

export const DEFAULT_TOKEN_SCOPE = 'openid';

const MAPPER_PURPOSES: Readonly<Record<string, string>> = {
  'oidc-audience-mapper': 'Adds an audience',
  'oidc-audience-resolve-mapper': 'Adds each client the user has roles in as an audience',
  'oidc-usermodel-client-role-mapper': 'Adds client roles',
  'oidc-usermodel-realm-role-mapper': 'Adds realm roles',
  'oidc-usermodel-attribute-mapper': 'Adds a user attribute',
  'oidc-usermodel-property-mapper': 'Adds a user property',
  'oidc-full-name-mapper': 'Adds the full name',
  'oidc-allowed-origins-mapper': 'Adds allowed web origins',
  'oidc-group-membership-mapper': 'Adds group membership',
  'oidc-hardcoded-claim-mapper': 'Adds a fixed claim',
  'oidc-hardcoded-role-mapper': 'Adds a fixed role',
  'oidc-role-name-mapper': 'Renames a role',
  'oidc-sub-mapper': 'Adds the subject (sub)',
  'oidc-acr-mapper': 'Adds the authentication level (acr)',
  'oidc-usersessionmodel-note-mapper': 'Adds a session value',
};

export const accessTokenPreviewSchema = z.object({
  app: z.string(),
  subject: z.enum(['user', 'service-account']),
  scope: z.string(),
  issuer: z.string().optional(),
  audience: z.array(z.string()),
  authorizedParty: z.string().optional(),
  scopes: z.array(z.string()),
  realmRoles: z.array(z.string()),
  clientRoles: z.array(z.object({ clientId: z.string(), roles: z.array(z.string()) })),
  lifetimeSeconds: z.number().optional(),
  allowedOrigins: z.array(z.string()),
  claimNames: z.array(z.string()),
  mappers: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      purpose: z.string().optional(),
      from: z.enum(['client', 'client-scope']),
      scope: z.string().optional(),
    }),
  ),
});

export type AccessTokenPreview = z.infer<typeof accessTokenPreviewSchema>;

interface TokenPreviewInput {
  app: string;
  subject: AccessTokenPreview['subject'];
  scope: string;
  claims: KeycloakRepresentation;
  mappers: KeycloakRepresentation[];
}

function audienceOf(claims: KeycloakRepresentation): string[] {
  return typeof claims.aud === 'string' ? [claims.aud] : [...stringList(claims.aud)];
}

export function toTokenPreview({ app, subject, scope, claims, mappers }: TokenPreviewInput): AccessTokenPreview {
  const issuedAt = typeof claims.iat === 'number' ? claims.iat : undefined;
  const expiresAt = typeof claims.exp === 'number' ? claims.exp : undefined;

  return {
    app,
    subject,
    scope,
    issuer: optionalString(claims.iss),
    audience: audienceOf(claims).sort(),
    authorizedParty: optionalString(claims.azp),
    scopes: (optionalString(claims.scope) ?? '')
      .split(' ')
      .filter((value) => value !== '')
      .sort(),
    realmRoles: [...stringList(asRecord(claims.realm_access).roles)].sort(),
    clientRoles: Object.entries(asRecord(claims.resource_access))
      .map(([clientId, access]) => ({ clientId, roles: [...stringList(asRecord(access).roles)].sort() }))
      .filter(({ roles }) => roles.length > 0)
      .sort((left, right) => left.clientId.localeCompare(right.clientId)),
    lifetimeSeconds: issuedAt !== undefined && expiresAt !== undefined ? expiresAt - issuedAt : undefined,
    allowedOrigins: [...stringList(claims['allowed-origins'])].sort(),
    claimNames: Object.keys(claims).sort(),
    mappers: mappers
      .map((mapper) => {
        const type = optionalString(mapper.protocolMapper) ?? '';
        const fromScope = mapper.containerType === 'client-scope';
        return {
          name: optionalString(mapper.mapperName) ?? '',
          type,
          ...(MAPPER_PURPOSES[type] ? { purpose: MAPPER_PURPOSES[type] } : {}),
          from: fromScope ? ('client-scope' as const) : ('client' as const),
          ...(fromScope && optionalString(mapper.containerName) ? { scope: optionalString(mapper.containerName) } : {}),
        };
      })
      .sort((left, right) => left.from.localeCompare(right.from) || left.name.localeCompare(right.name)),
  };
}

export const accessClientSetupValuesSchema = z.object({
  issuer: z.string(),
  tokenUrl: z.string(),
  keycloakJs: z.object({ url: z.string(), realm: z.string(), clientId: z.string() }).optional(),
  curl: z.string().optional(),
});

export type AccessClientSetupValues = z.infer<typeof accessClientSetupValuesSchema>;

export const CLIENT_SECRET_PLACEHOLDER = '<client-secret>';

/**
 * The values an app needs to use the client: keycloak-js settings for a browser app, or a client-credentials token
 * request for a service account. The secret is always a placeholder; it is never read.
 */
export function toClientSetupValues(host: string, realm: string, client: AccessClientDetails): AccessClientSetupValues {
  const keycloakUrl = new URL('/auth', host).href;
  const issuer = `${keycloakUrl}/realms/${encodeURIComponent(realm)}`;
  const tokenUrl = `${issuer}/protocol/openid-connect/token`;

  return {
    issuer,
    tokenUrl,
    ...(client.type === 'public' ? { keycloakJs: { url: keycloakUrl, realm, clientId: client.clientId } } : {}),
    ...(client.type === 'confidential' && client.flows.serviceAccounts
      ? {
          curl:
            `curl -X POST '${tokenUrl}' --data-urlencode 'grant_type=client_credentials' ` +
            `--data-urlencode 'client_id=${client.clientId}' --data-urlencode 'client_secret=${CLIENT_SECRET_PLACEHOLDER}'`,
        }
      : {}),
  };
}

/**
 * When the client secret was created, from Keycloak's client attribute in seconds. The secret itself is never read.
 */
export function readSecretCreatedAt(client: KeycloakRepresentation): Date | undefined {
  const seconds = Number(asRecord(client.attributes)['client.secret.creation.time']);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000) : undefined;
}
