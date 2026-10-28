import z from 'zod';
import type { KeycloakClientConfiguration, KeycloakRepresentation } from './clientReader';
import {
  asRecord,
  attributeBoolean,
  attributeNumber,
  attributeString,
  displayText,
  optionalBoolean,
  optionalString,
  recordList,
  stringList,
} from './values';

/**
 * Troubleshooting view of a Keycloak client. Every field is read from an explicit allowlist, so secrets, credentials,
 * keys, registration tokens and hard-coded claim values in the Keycloak representation are never copied.
 * Fields Keycloak did not return are left out rather than defaulted, so the agent never reports a guessed value.
 */

// Clients Keycloak creates in every realm.
const KEYCLOAK_BUILT_IN_CLIENT_IDS: ReadonlySet<string> = new Set([
  'account',
  'account-console',
  'admin-cli',
  'broker',
  'realm-management',
  'security-admin-console',
]);

const CLIENT_AUTHENTICATOR_LABELS: Record<string, string> = {
  'client-secret': 'Client ID and secret',
  'client-jwt': 'Signed JWT',
  'client-secret-jwt': 'Signed JWT with client secret',
  'client-x509': 'X509 certificate',
};

const POST_LOGOUT_REDIRECT_URI_SEPARATOR = '##';

const MAPPER_TEXT_SETTINGS = {
  claimName: 'claim.name',
  claimJsonType: 'jsonType.label',
  includedClientAudience: 'included.client.audience',
  includedCustomAudience: 'included.custom.audience',
  userAttribute: 'user.attribute',
  rolesFromClientId: 'usermodel.clientRoleMapping.clientId',
  clientRolePrefix: 'usermodel.clientRoleMapping.rolePrefix',
  realmRolePrefix: 'usermodel.realmRoleMapping.rolePrefix',
  role: 'role',
  newRoleName: 'new.role.name',
  samlAttributeName: 'attribute.name',
  samlAttributeNameFormat: 'attribute.nameformat',
  samlFriendlyName: 'friendly.name',
} as const;

const MAPPER_FLAG_SETTINGS = {
  addToAccessToken: 'access.token.claim',
  addToIdToken: 'id.token.claim',
  addToUserInfo: 'userinfo.token.claim',
  addToIntrospection: 'introspection.token.claim',
  addToLightweightAccessToken: 'lightweight.claim',
  multivalued: 'multivalued',
  fullGroupPath: 'full.path',
} as const;

function optionalSettingsSchema<K extends string, S extends z.ZodTypeAny>(table: Record<K, string>, schema: S) {
  return Object.fromEntries(Object.keys(table).map((key) => [key, schema.optional()])) as Record<K, z.ZodOptional<S>>;
}

const accessClientTypeSchema = z.enum(['public', 'confidential', 'bearer-only']);

export const accessClientSummarySchema = z.object({
  clientId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  type: accessClientTypeSchema.optional(),
  protocol: z.string().optional(),
  builtIn: z.boolean(),
});

const protocolMapperSchema = z.object({
  name: z.string(),
  mapperType: z.string(),
  protocol: z.string().optional(),
  settings: z.object({
    ...optionalSettingsSchema(MAPPER_TEXT_SETTINGS, z.string()),
    ...optionalSettingsSchema(MAPPER_FLAG_SETTINGS, z.boolean()),
  }),
});

export const accessClientDetailsSchema = accessClientSummarySchema.extend({
  urls: z.object({
    root: z.string().optional(),
    home: z.string().optional(),
    admin: z.string().optional(),
  }),
  authentication: z.object({
    clientAuthentication: z.boolean().optional(),
    authenticator: z.string().optional(),
    jwksUrl: z.string().optional(),
    certificateBoundAccessTokens: z.boolean().optional(),
    consentRequired: z.boolean().optional(),
    pkceMethod: z.string().optional(),
  }),
  flows: z.object({
    standardFlow: z.boolean().optional(),
    implicitFlow: z.boolean().optional(),
    directAccessGrants: z.boolean().optional(),
    serviceAccounts: z.boolean().optional(),
    deviceAuthorizationGrant: z.boolean(),
    ciba: z.boolean(),
  }),
  redirects: z.object({
    redirectUris: z.array(z.string()),
    webOrigins: z.array(z.string()),
    postLogoutRedirectUris: z.array(z.string()),
  }),
  roles: z.array(z.object({ name: z.string(), description: z.string().optional(), composite: z.boolean() })),
  scopes: z.object({
    defaultClientScopes: z.array(z.string()),
    optionalClientScopes: z.array(z.string()),
    fullScopeAllowed: z.boolean().optional(),
    realmRoleScopeMappings: z.array(z.string()),
    clientRoleScopeMappings: z.array(z.object({ clientId: z.string(), roles: z.array(z.string()) })),
  }),
  protocolMappers: z.array(protocolMapperSchema),
  tokens: z.object({
    accessTokenLifespanSeconds: z.number().optional(),
    clientSessionIdleTimeoutSeconds: z.number().optional(),
    clientSessionMaxLifespanSeconds: z.number().optional(),
    useRefreshTokens: z.boolean().optional(),
    accessTokenSignatureAlgorithm: z.string().optional(),
    idTokenSignatureAlgorithm: z.string().optional(),
  }),
  logout: z.object({
    frontChannelLogout: z.boolean().optional(),
    frontChannelLogoutUrl: z.string().optional(),
    backChannelLogoutUrl: z.string().optional(),
    backChannelLogoutSessionRequired: z.boolean().optional(),
  }),
  authorizationServicesEnabled: z.boolean(),
});

export type AccessClientType = z.infer<typeof accessClientTypeSchema>;
export type AccessClientSummary = z.infer<typeof accessClientSummarySchema>;
export type AccessClientDetails = z.infer<typeof accessClientDetailsSchema>;
type AccessClientProtocolMapper = z.infer<typeof protocolMapperSchema>;

function sortedStrings(value: unknown): string[] {
  return [...stringList(value)].sort();
}

function roleNames(value: unknown): string[] {
  return recordList(value)
    .map((role) => optionalString(role.name))
    .filter((name): name is string => !!name)
    .sort();
}

/**
 * Copies the settings named in the table, read with the given reader, leaving out any that are not set.
 */
function pickSettings<K extends string, T>(
  source: Record<string, unknown>,
  table: Record<K, string>,
  read: (value: unknown) => T | undefined,
): Partial<Record<K, T>> {
  const settings: Partial<Record<K, T>> = {};
  for (const [key, sourceKey] of Object.entries(table) as Array<[K, string]>) {
    const value = read(source[sourceKey]);
    if (value !== undefined) {
      settings[key] = value;
    }
  }
  return settings;
}

function toClientType(client: KeycloakRepresentation): AccessClientType | undefined {
  if (client.bearerOnly === true) {
    return 'bearer-only';
  }
  if (typeof client.publicClient === 'boolean') {
    return client.publicClient ? 'public' : 'confidential';
  }
  return undefined;
}

function summarize(clientId: string, client: KeycloakRepresentation): AccessClientSummary {
  return {
    clientId,
    name: displayText(client.name),
    description: displayText(client.description),
    enabled: optionalBoolean(client.enabled),
    type: toClientType(client),
    protocol: optionalString(client.protocol),
    builtIn: KEYCLOAK_BUILT_IN_CLIENT_IDS.has(clientId),
  };
}

/**
 * Summarizes a Keycloak client for a client list. Returns undefined for a representation without a client ID.
 */
export function toClientSummary(client: KeycloakRepresentation): AccessClientSummary | undefined {
  const clientId = optionalString(client.clientId);
  return clientId ? summarize(clientId, client) : undefined;
}

function toAuthentication(
  client: KeycloakRepresentation,
  attributes: Record<string, unknown>,
): AccessClientDetails['authentication'] {
  const isConfidential = toClientType(client) === 'confidential';
  const authenticatorType = optionalString(client.clientAuthenticatorType);

  return {
    clientAuthentication: typeof client.publicClient === 'boolean' ? !client.publicClient : undefined,
    // Keycloak keeps an authenticator on public clients too, but it only applies to confidential clients.
    authenticator:
      isConfidential && authenticatorType
        ? (CLIENT_AUTHENTICATOR_LABELS[authenticatorType] ?? authenticatorType)
        : undefined,
    jwksUrl: attributeBoolean(attributes['use.jwks.url']) ? attributeString(attributes['jwks.url']) : undefined,
    certificateBoundAccessTokens: attributeBoolean(attributes['tls.client.certificate.bound.access.tokens']),
    consentRequired: optionalBoolean(client.consentRequired),
    pkceMethod: attributeString(attributes['pkce.code.challenge.method']),
  };
}

function toFlows(client: KeycloakRepresentation, attributes: Record<string, unknown>): AccessClientDetails['flows'] {
  return {
    standardFlow: optionalBoolean(client.standardFlowEnabled),
    implicitFlow: optionalBoolean(client.implicitFlowEnabled),
    directAccessGrants: optionalBoolean(client.directAccessGrantsEnabled),
    serviceAccounts: optionalBoolean(client.serviceAccountsEnabled),
    // Keycloak treats these grants as disabled unless the attribute is "true".
    deviceAuthorizationGrant: attributeBoolean(attributes['oauth2.device.authorization.grant.enabled']) === true,
    ciba: attributeBoolean(attributes['oidc.ciba.grant.enabled']) === true,
  };
}

function toRedirects(
  client: KeycloakRepresentation,
  attributes: Record<string, unknown>,
): AccessClientDetails['redirects'] {
  const postLogoutRedirectUris = attributeString(attributes['post.logout.redirect.uris']);

  return {
    redirectUris: sortedStrings(client.redirectUris),
    webOrigins: sortedStrings(client.webOrigins),
    postLogoutRedirectUris: postLogoutRedirectUris
      ? postLogoutRedirectUris
          .split(POST_LOGOUT_REDIRECT_URI_SEPARATOR)
          .map((uri) => uri.trim())
          .filter((uri) => uri !== '')
          .sort()
      : [],
  };
}

function toRoles(roles: KeycloakRepresentation[]): AccessClientDetails['roles'] {
  return roles
    .flatMap((role) => {
      const name = optionalString(role.name);
      return name ? [{ name, description: displayText(role.description), composite: role.composite === true }] : [];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function toScopes(
  client: KeycloakRepresentation,
  scopeMappings: KeycloakRepresentation,
): AccessClientDetails['scopes'] {
  const clientRoleScopeMappings = Object.entries(asRecord(scopeMappings.clientMappings))
    .map(([key, value]) => {
      const mapping = asRecord(value);
      return { clientId: optionalString(mapping.client) ?? key, roles: roleNames(mapping.mappings) };
    })
    .filter(({ roles }) => roles.length > 0)
    .sort((left, right) => left.clientId.localeCompare(right.clientId));

  return {
    defaultClientScopes: sortedStrings(client.defaultClientScopes),
    optionalClientScopes: sortedStrings(client.optionalClientScopes),
    fullScopeAllowed: optionalBoolean(client.fullScopeAllowed),
    realmRoleScopeMappings: roleNames(scopeMappings.realmMappings),
    clientRoleScopeMappings,
  };
}

function toProtocolMapper(mapper: KeycloakRepresentation): AccessClientProtocolMapper {
  const config = asRecord(mapper.config);

  return {
    name: optionalString(mapper.name) ?? '',
    mapperType: optionalString(mapper.protocolMapper) ?? '',
    protocol: optionalString(mapper.protocol),
    settings: {
      ...pickSettings(config, MAPPER_TEXT_SETTINGS, attributeString),
      ...pickSettings(config, MAPPER_FLAG_SETTINGS, attributeBoolean),
    },
  };
}

function toTokens(attributes: Record<string, unknown>): AccessClientDetails['tokens'] {
  return {
    accessTokenLifespanSeconds: attributeNumber(attributes['access.token.lifespan']),
    clientSessionIdleTimeoutSeconds: attributeNumber(attributes['client.session.idle.timeout']),
    clientSessionMaxLifespanSeconds: attributeNumber(attributes['client.session.max.lifespan']),
    useRefreshTokens: attributeBoolean(attributes['use.refresh.tokens']),
    accessTokenSignatureAlgorithm: attributeString(attributes['access.token.signed.response.alg']),
    idTokenSignatureAlgorithm: attributeString(attributes['id.token.signed.response.alg']),
  };
}

function toLogout(client: KeycloakRepresentation, attributes: Record<string, unknown>): AccessClientDetails['logout'] {
  return {
    frontChannelLogout: optionalBoolean(client.frontchannelLogout),
    frontChannelLogoutUrl: attributeString(attributes['frontchannel.logout.url']),
    backChannelLogoutUrl: attributeString(attributes['backchannel.logout.url']),
    backChannelLogoutSessionRequired: attributeBoolean(attributes['backchannel.logout.session.required']),
  };
}

/**
 * Builds the troubleshooting view of a client from its Keycloak configuration, roles and role scope mappings.
 */
export function toClientDetails({ client, roles, scopeMappings }: KeycloakClientConfiguration): AccessClientDetails {
  const attributes = asRecord(client.attributes);

  return {
    ...summarize(optionalString(client.clientId) ?? '', client),
    urls: {
      root: attributeString(client.rootUrl),
      home: attributeString(client.baseUrl),
      admin: attributeString(client.adminUrl),
    },
    authentication: toAuthentication(client, attributes),
    flows: toFlows(client, attributes),
    redirects: toRedirects(client, attributes),
    roles: toRoles(roles),
    scopes: toScopes(client, scopeMappings),
    protocolMappers: recordList(client.protocolMappers)
      .map(toProtocolMapper)
      .sort((left, right) => left.name.localeCompare(right.name)),
    tokens: toTokens(attributes),
    logout: toLogout(client, attributes),
    authorizationServicesEnabled: client.authorizationServicesEnabled === true,
  };
}
