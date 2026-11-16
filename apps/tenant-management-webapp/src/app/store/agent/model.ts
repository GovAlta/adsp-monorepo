import { AgentMessage, ConversationStatus, UserMessage } from '@core-services/app-common';

/** The Access Service supervisor agent; it answers every Access Service question. */
export const ACCESS_SERVICE_AGENT_ID = 'AccessServiceAgent';

interface Thread {
  id: string;
  agent: string;
}

export interface ToolDescription {
  id: string;
  description: string;
}

export type ApiToolMethods = 'GET' | 'POST' | 'PUT' | 'PATCH';
export interface ApiToolConfiguration extends ToolDescription {
  type: 'api';
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  method: ApiToolMethods;
  api: string;
  path: string;
  userContext?: boolean;
}

type ToolConfiguration = string | ApiToolConfiguration;

export interface McpServerConfiguration {
  url: string;
  headers?: Record<string, string>;
  capabilities?: string[];
}

export interface McpConfiguration {
  servers: McpServerConfiguration[];
}

export interface AgentConfiguration {
  core?: boolean;
  id: string;
  name: string;
  description?: string;
  instructions: string;
  workspace?: { enabled: boolean };
  outputSchema?: Record<string, unknown> | null;
  userRoles?: string[];
  agents?: string[];
  tools?: ToolConfiguration[];
  mcp?: McpConfiguration;
}

/**
 * An agent reply as kept in the store. interrupted marks a reply whose stream was cut off when the socket reconnected:
 * it is shown as finished, but agent-service may still be generating and saving it.
 */
export interface StoredAgentMessage extends AgentMessage {
  interrupted?: boolean;
}

export interface AgentState {
  connected: boolean;
  threads: Record<string, Thread>;
  threadMessages: Record<string, string[]>;
  messages: Record<string, UserMessage | StoredAgentMessage>;
  /** Conversation status that agent-service sent after each thread's last reply, by thread ID. */
  conversationStatus: Record<string, ConversationStatus>;
  agents: Record<string, AgentConfiguration>;
  availableTools: ToolDescription[];
  editor: {
    agent: AgentConfiguration;
    threadId: string;
    hasChanges: boolean;
    stalePreview: boolean;
  };
  busy: {
    connecting: boolean;
    disconnecting: boolean;
    loading: boolean;
    saving: boolean;
  };
}

export type AccessDiscoveryStatus = 'available' | 'unavailable' | 'not-found' | 'unreachable';

export interface AccessEnvironmentSummary {
  id: string;
  label: string;
  host: string;
  readOnly: boolean;
}

export type AccessRealmKind = 'tenant' | 'core';

/** Access Service environment and realm the signed-in user may inspect, as returned by agent-service. */
export interface AccessScope {
  status: 'available' | 'unavailable';
  reason?: string;
  message: string;
  missingRoles?: string[];
  environment?: AccessEnvironmentSummary;
  realm?: { id: string; kind: AccessRealmKind };
  readOnly?: boolean;
}

/** Topics of the documented Access Service guide. */
export type AccessGuideTopic =
  | 'realm-model'
  | 'environments'
  | 'responsibility'
  | 'add-tenant-admin'
  | 'glossary'
  | 'public-client'
  | 'confidential-client'
  | 'public-vs-confidential'
  | 'client-troubleshooting'
  | 'token-expiry'
  | 'token-claims'
  | 'token-audience'
  | 'idp-claim-to-token'
  | 'goa-ad'
  | 'uiam-integration'
  | 'saml-certificates'
  | 'architecture'
  | 'operations'
  | 'disaster-recovery';

/**
 * One topic of the Access Service guide, as agent-service serves it without AI, and as the agent's getAccessGuide tool
 * returns it.
 */
export interface AccessGuideSection {
  topic: AccessGuideTopic;
  title: string;
  markdown: string;
}

export type AccessClientType = 'public' | 'confidential' | 'bearer-only';

/** A client in the user's realm, as listed by the Access Service agent's listAccessClients tool. */
export interface AccessClientSummary {
  clientId: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  type?: AccessClientType;
  protocol?: string;
  builtIn: boolean;
  /** Who the client belongs to: Keycloak itself, the ADSP platform, or the tenant. */
  origin?: 'keycloak' | 'platform' | 'tenant';
  serviceAccount?: boolean;
}

export interface AccessClientProtocolMapper {
  name: string;
  mapperType: string;
  protocol?: string;
  settings: {
    claimName?: string;
    claimJsonType?: string;
    includedClientAudience?: string;
    includedCustomAudience?: string;
    userAttribute?: string;
    rolesFromClientId?: string;
    clientRolePrefix?: string;
    realmRolePrefix?: string;
    role?: string;
    newRoleName?: string;
    samlAttributeName?: string;
    samlAttributeNameFormat?: string;
    samlFriendlyName?: string;
    addToAccessToken?: boolean;
    addToIdToken?: boolean;
    addToUserInfo?: boolean;
    addToIntrospection?: boolean;
    addToLightweightAccessToken?: boolean;
    multivalued?: boolean;
    fullGroupPath?: boolean;
  };
}

/** Details that identify a user, as returned by the Access Service agent's findAccessUser tool. */
export interface AccessUser {
  id: string;
  username: string;
  enabled?: boolean;
  emailVerified?: boolean;
  requiredActions: string[];
  identityProviders: string[];
}

export interface AccessRoleRef {
  name: string;
  client?: string;
}

/** Where a role assignment comes from: the user, a group, a composite role chain, or untraced. */
export interface AccessUserRoleSource {
  type: 'direct' | 'group' | 'composite' | 'unresolved';
  group?: string;
  via?: AccessRoleRef[];
}

export interface AccessUserAssignedRole {
  name: string;
  description?: string;
  composite: boolean;
  inherited: boolean;
  sources: AccessUserRoleSource[];
}

/** A user's role assignments, as returned by the Access Service agent's getAccessUserRoles tool. */
export interface AccessUserRoles {
  realmRoles: AccessUserAssignedRole[];
  clientRoles: Array<{ clientId: string; roles: AccessUserAssignedRole[] }>;
  groups: string[];
  counts: { direct: number; inherited: number };
  incomplete?: boolean;
}

/** Non-sensitive configuration of one client, as returned by the Access Service agent's getAccessClient tool. */
export interface AccessClientDetails extends AccessClientSummary {
  urls: { root?: string; home?: string; admin?: string };
  authentication: {
    clientAuthentication?: boolean;
    authenticator?: string;
    jwksUrl?: string;
    certificateBoundAccessTokens?: boolean;
    consentRequired?: boolean;
    pkceMethod?: string;
  };
  flows: {
    standardFlow?: boolean;
    implicitFlow?: boolean;
    directAccessGrants?: boolean;
    serviceAccounts?: boolean;
    deviceAuthorizationGrant: boolean;
    ciba: boolean;
  };
  redirects: { redirectUris: string[]; webOrigins: string[]; postLogoutRedirectUris: string[] };
  roles: Array<{ name: string; description?: string; composite: boolean }>;
  scopes: {
    defaultClientScopes: string[];
    optionalClientScopes: string[];
    fullScopeAllowed?: boolean;
    realmRoleScopeMappings: string[];
    clientRoleScopeMappings: Array<{ clientId: string; roles: string[] }>;
  };
  protocolMappers: AccessClientProtocolMapper[];
  tokens: {
    accessTokenLifespanSeconds?: number;
    clientSessionIdleTimeoutSeconds?: number;
    clientSessionMaxLifespanSeconds?: number;
    useRefreshTokens?: boolean;
    accessTokenSignatureAlgorithm?: string;
    idTokenSignatureAlgorithm?: string;
  };
  logout: {
    frontChannelLogout?: boolean;
    frontChannelLogoutUrl?: string;
    backChannelLogoutUrl?: string;
    backChannelLogoutSessionRequired?: boolean;
  };
  authorizationServicesEnabled: boolean;
}

/** How a person or service account was matched to the text the user gave. */
export type AccessUserMatch = 'username' | 'email' | 'service-account' | 'search';

/** Why a person can or cannot sign in, as returned by the getAccessUserSignInStatus tool. */
export interface AccessSignInStatus {
  enabled?: boolean;
  lockout?: {
    protectionOn?: boolean;
    permanent?: boolean;
    lockedOut?: boolean;
    failedAttempts?: number;
    lastFailureAt?: string;
    lockedUntil?: string;
  };
  requiredActions: Array<{ action: string; meaning: string }>;
  signInMethods: { identityProviders: string[]; password?: boolean; otp?: boolean; securityKey?: boolean };
  sessions?: Array<{ started?: string; lastActive?: string; apps: string[] }>;
  history?: {
    recording?: boolean;
    lastSignInAt?: string;
    recentErrors: Array<{ time?: string; step: string; error: string; meaning?: string; app?: string }>;
  };
  notes: string[];
}

/** One service's roles checked against a person or service account. */
export interface AccessServiceCheck {
  service: string;
  rolesFrom: 'platform' | 'tenant' | 'client';
  roles: Array<{
    role: string;
    description?: string;
    inTenantAdmin?: boolean;
    has: boolean;
    sources: AccessUserRoleSource[];
    inToken?: boolean;
  }>;
  otherRoles: Array<{ role: string; sources: AccessUserRoleSource[] }>;
  token?: { app: string; audienceIncluded: boolean };
}

export interface AccessComparedRole extends AccessRoleRef {
  sources: AccessUserRoleSource[];
}

/** The access only one of two people has, as returned by the compareAccessUsers tool. */
export interface AccessUserComparison {
  onlyFirst: AccessComparedRole[];
  onlySecond: AccessComparedRole[];
  sharedCount: number;
  groups: { onlyFirst: string[]; onlySecond: string[] };
  truncated?: boolean;
}

export interface AccessComparedPerson {
  search: string;
  matchedBy?: AccessUserMatch;
  user?: AccessUser;
  suggestions?: string[];
}

/** Roles one ADSP service defines, from the service role catalog. */
export interface AccessServiceRolesEntry {
  service: string;
  source: 'platform' | 'tenant';
  roles: Array<{ role: string; description?: string; inTenantAdmin: boolean }>;
}

/** One role explained, as returned by the getAccessRole tool. */
export interface AccessRoleDetails extends AccessRoleRef {
  description?: string;
  composite: boolean;
  inTenantAdmin?: boolean;
  includes: AccessRoleRef[];
  includedIn: Array<AccessRoleRef & { via: AccessRoleRef[] }>;
  truncated?: boolean;
}

export interface AccessRoleMember {
  username: string;
  serviceAccount: boolean;
  enabled?: boolean;
  sources: AccessUserRoleSource[];
}

export interface AccessClientFinding {
  id: string;
  severity: 'problem' | 'warning' | 'tip';
  title: string;
  fix: string;
}

export interface AccessClientSetupValues {
  issuer: string;
  tokenUrl: string;
  keycloakJs?: { url: string; realm: string; clientId: string };
  curl?: string;
}

export interface AccessUrlMatch {
  allowed: boolean;
  matchedBy?: string;
}

/** Whether an app address is allowed by a client, as returned by the checkAccessClientUrl tool. */
export interface AccessClientUrlCheck {
  url: string;
  origin: string;
  redirect: AccessUrlMatch;
  webOrigin: AccessUrlMatch;
  postLogout: AccessUrlMatch;
  suggestions: { redirectUri?: string; webOrigin?: string; postLogoutRedirectUri?: string };
}

/** What a token from a client would contain, as returned by the previewAccessToken tool. */
export interface AccessTokenPreview {
  app: string;
  subject: 'user' | 'service-account';
  scope: string;
  issuer?: string;
  audience: string[];
  authorizedParty?: string;
  scopes: string[];
  realmRoles: string[];
  clientRoles: Array<{ clientId: string; roles: string[] }>;
  lifetimeSeconds?: number;
  allowedOrigins: string[];
  claimNames: string[];
  mappers: Array<{ name: string; type: string; purpose?: string; from: 'client' | 'client-scope'; scope?: string }>;
}

/** A client's service account, as returned by the getAccessServiceAccount tool. */
export interface AccessServiceAccount {
  username: string;
  enabled?: boolean;
  secretCreatedAt?: string;
}
