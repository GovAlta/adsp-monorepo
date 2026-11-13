import type {
  AccessClientDetails,
  AccessClientSetupValues,
  AccessClientSummary,
  AccessTokenPreview,
  ClientFinding,
  ClientUrlCheck,
} from '../agents/access/discovery';
import {
  describeFields,
  describeFieldsLine,
  describeItems,
  describeList,
  flag,
  joinParts,
  ModelLine,
  shortTime,
} from './accessModelOutput';

/**
 * Compact model views of Keycloak clients, their setup checks and token previews.
 */

type ProtocolMapper = AccessClientDetails['protocolMappers'][number];
type TokenMapper = AccessTokenPreview['mappers'][number];

interface ServiceAccountView {
  username: string;
  enabled?: boolean;
  secretCreatedAt?: string;
}

interface ClientLookupView {
  clientId: string;
  suggestions?: string[];
}

interface UrlMatch {
  allowed: boolean;
  matchedBy?: string;
}

export function describeClientLookup({ clientId, suggestions }: ClientLookupView): ModelLine[] {
  return [`client ID: ${clientId}`, suggestions && describeList('suggestions', suggestions)];
}

export function describeClientSummary(client: AccessClientSummary): string {
  const { clientId, name, description, enabled, type, protocol, builtIn, origin, serviceAccount } = client;
  const facts = joinParts([
    type,
    protocol,
    flag(enabled, 'enabled', 'disabled'),
    `origin ${origin}`,
    builtIn && 'built-in',
    flag(serviceAccount, 'service account', 'no service account'),
  ]);
  const named = name && name !== clientId ? `${clientId} "${name}"` : clientId;
  return `${named}: ${facts}${description ? ` — ${description}` : ''}`;
}

function describeClientRole({ name, description, composite }: AccessClientDetails['roles'][number]): string {
  return `${name}${composite ? ' (composite)' : ''}${description ? ` — ${description}` : ''}`;
}

function describeProtocolMapper(
  { name, mapperType, protocol, settings }: ProtocolMapper,
  clientProtocol?: string,
): string {
  const type = joinParts([mapperType, protocol !== clientProtocol && protocol]);
  return joinParts([`${name} (${type})`, describeFields(settings)], ': ');
}

function describeScopes({ scopes }: AccessClientDetails): ModelLine[] {
  return [
    describeList('default client scopes', scopes.defaultClientScopes),
    describeList('optional client scopes', scopes.optionalClientScopes),
    scopes.fullScopeAllowed !== undefined && `full scope allowed: ${scopes.fullScopeAllowed}`,
    describeList('realm role scope mappings', scopes.realmRoleScopeMappings),
    describeList(
      'client role scope mappings',
      scopes.clientRoleScopeMappings.map(({ clientId, roles }) => `${clientId}: ${roles.join(' ')}`),
    ),
  ];
}

export function describeClientDetails(client?: AccessClientDetails): ModelLine[] {
  if (!client) {
    return [];
  }
  const { urls, authentication, flows, redirects, roles, protocolMappers, tokens, logout } = client;
  return [
    `client: ${describeClientSummary(client)}`,
    describeFieldsLine('urls', urls),
    describeFieldsLine('authentication', authentication),
    describeFieldsLine('flows', { ...flows, authorizationServicesEnabled: client.authorizationServicesEnabled }),
    describeList('redirect URIs', redirects.redirectUris),
    describeList('web origins', redirects.webOrigins),
    describeList('post-logout redirect URIs', redirects.postLogoutRedirectUris),
    ...describeItems('client roles', roles.map(describeClientRole)),
    ...describeScopes(client),
    ...describeItems(
      'protocol mappers (own only; mappers from client scopes not included)',
      protocolMappers.map((mapper) => describeProtocolMapper(mapper, client.protocol)),
    ),
    describeFieldsLine('tokens', tokens),
    describeFieldsLine('logout', logout),
  ];
}

export function describeFindings(findings?: ClientFinding[]): ModelLine[] {
  if (!findings) {
    return [];
  }
  return describeItems(
    'findings',
    findings.map(({ id, severity, title, fix }) => `${severity} ${id}: ${title} Fix: ${fix}`),
  );
}

export function describeSetupValues(setup?: AccessClientSetupValues): ModelLine[] {
  if (!setup) {
    return [];
  }
  return [
    `issuer: ${setup.issuer}`,
    `token URL: ${setup.tokenUrl}`,
    setup.keycloakJs && describeFieldsLine('keycloak-js settings', setup.keycloakJs),
    setup.curl && `token request: ${setup.curl}`,
  ];
}

function describeUrlMatch(label: string, { allowed, matchedBy }: UrlMatch, suggestion?: string): string {
  const facts = joinParts(
    [allowed ? 'allowed' : 'not allowed', matchedBy && `matched by ${matchedBy}`, suggestion && `add ${suggestion}`],
    '; ',
  );
  return `${label}: ${facts}`;
}

export function describeUrlCheck(check?: ClientUrlCheck): ModelLine[] {
  if (!check) {
    return [];
  }
  const { url, origin, redirect, webOrigin, postLogout, suggestions } = check;
  return [
    `url: ${url} (origin ${origin})`,
    describeUrlMatch('redirect URI', redirect, suggestions.redirectUri),
    describeUrlMatch('web origin', webOrigin, suggestions.webOrigin),
    describeUrlMatch('post-logout redirect URI', postLogout, suggestions.postLogoutRedirectUri),
  ];
}

function describeTokenMapper({ name, type, purpose, from, scope }: TokenMapper): string {
  const source = from === 'client-scope' ? joinParts(['client scope', scope], ' ') : 'client';
  return `${name} (${type}) from ${source}${purpose ? `: ${purpose}` : ''}`;
}

export function describeTokenPreview(preview?: AccessTokenPreview): ModelLine[] {
  if (!preview) {
    return [];
  }
  const { app, subject, scope, issuer, audience, authorizedParty, lifetimeSeconds } = preview;
  return [
    `token preview: ${subject} token from ${app}, requested scope "${scope}" (no token was issued)`,
    issuer && `issuer: ${issuer}`,
    describeList('audience', audience),
    authorizedParty && `authorized party: ${authorizedParty}`,
    describeList('scopes', preview.scopes),
    describeList('realm roles', preview.realmRoles),
    ...describeItems(
      'client roles',
      preview.clientRoles.map(({ clientId, roles }) => `${clientId}: ${roles.join(', ')}`),
    ),
    lifetimeSeconds !== undefined && `lifetime: ${lifetimeSeconds}s`,
    describeList('allowed origins', preview.allowedOrigins),
    describeList('claim names (values not shown)', preview.claimNames),
    ...describeItems('mappers', preview.mappers.map(describeTokenMapper)),
  ];
}

export function describeServiceAccount(serviceAccount?: ServiceAccountView): string | undefined {
  if (!serviceAccount) {
    return undefined;
  }
  const { username, enabled, secretCreatedAt } = serviceAccount;
  return `service account: ${joinParts([
    username,
    flag(enabled, 'enabled', 'disabled'),
    secretCreatedAt && `secret created ${shortTime(secretCreatedAt)}`,
  ])}`;
}
