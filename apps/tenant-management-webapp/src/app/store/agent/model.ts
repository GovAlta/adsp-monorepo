import { AgentMessage, UserMessage } from '@core-services/app-common';

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
