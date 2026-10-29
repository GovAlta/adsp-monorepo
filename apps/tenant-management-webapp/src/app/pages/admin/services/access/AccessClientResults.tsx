import React, { FunctionComponent, ReactNode } from 'react';
import type {
  AccessClientDetails,
  AccessClientProtocolMapper,
  AccessClientSummary,
  AccessClientType,
} from '@store/agent/model';

type MapperSettings = AccessClientProtocolMapper['settings'];

const CLIENT_TYPE_LABELS: Record<AccessClientType, string> = {
  public: 'Public',
  confidential: 'Confidential',
  'bearer-only': 'Bearer-only',
};

const MAPPER_TOKEN_TARGETS: Array<[keyof MapperSettings, string]> = [
  ['addToAccessToken', 'Access token'],
  ['addToIdToken', 'ID token'],
  ['addToUserInfo', 'User info'],
  ['addToIntrospection', 'Introspection'],
  ['addToLightweightAccessToken', 'Lightweight access token'],
];

const MAPPER_DETAIL_LABELS: Array<[keyof MapperSettings, string]> = [
  ['includedClientAudience', 'Audience'],
  ['includedCustomAudience', 'Custom audience'],
  ['userAttribute', 'User attribute'],
  ['rolesFromClientId', 'Roles from client'],
  ['role', 'Role'],
  ['newRoleName', 'New role name'],
  ['samlAttributeName', 'SAML attribute'],
];

const NOT_RETURNED = 'Not returned';

function onOff(value?: boolean): string {
  if (value === undefined) {
    return NOT_RETURNED;
  }
  return value ? 'On' : 'Off';
}

function clientTypeLabel(type?: AccessClientType): string {
  return type ? (CLIENT_TYPE_LABELS[type] ?? type) : NOT_RETURNED;
}

function enabledLabel(enabled?: boolean): string {
  if (enabled === undefined) {
    return NOT_RETURNED;
  }
  return enabled ? 'Enabled' : 'Disabled';
}

const Entry: FunctionComponent<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </>
);

const OptionalEntry: FunctionComponent<{ label: string; value?: string | number; code?: boolean }> = ({
  label,
  value,
  code,
}) => (value === undefined ? null : <Entry label={label}>{code ? <code>{value}</code> : value}</Entry>);

const ValueList: FunctionComponent<{ values: string[]; testId?: string }> = ({ values, testId }) =>
  values.length > 0 ? (
    <ul data-testid={testId}>
      {values.map((value) => (
        <li key={value}>
          <code>{value}</code>
        </li>
      ))}
    </ul>
  ) : (
    <p data-testid={testId}>None configured.</p>
  );

export const ClientList: FunctionComponent<{
  clients: AccessClientSummary[];
  truncated?: boolean;
  message?: string;
}> = ({ clients, truncated, message }) => {
  if (clients.length === 0) {
    return <p data-testid="access-clients-empty">{message}</p>;
  }

  return (
    <>
      <table data-testid="access-clients-table">
        <thead>
          <tr>
            <th>Client ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.clientId}>
              <td>
                <code>{client.clientId}</code>
                {client.builtIn && ' (Keycloak built-in)'}
              </td>
              <td>{client.name ?? ''}</td>
              <td>{clientTypeLabel(client.type)}</td>
              <td>{enabledLabel(client.enabled)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {truncated && <p>Only the first {clients.length} clients are shown. Search by client ID to narrow the list.</p>}
    </>
  );
};

export const ClientSuggestions: FunctionComponent<{ suggestions?: string[] }> = ({ suggestions }) =>
  suggestions?.length > 0 ? (
    <div data-testid="access-client-suggestions">
      <p>Client IDs containing that text:</p>
      <ValueList values={suggestions} />
    </div>
  ) : null;

const ClientOverview: FunctionComponent<{ client: AccessClientDetails }> = ({ client }) => (
  <dl data-testid="access-client-overview">
    <Entry label="Client ID">
      <code>{client.clientId}</code>
      {client.builtIn && ' (Keycloak built-in)'}
    </Entry>
    <OptionalEntry label="Name" value={client.name} />
    <OptionalEntry label="Description" value={client.description} />
    <Entry label="Status">{enabledLabel(client.enabled)}</Entry>
    <Entry label="Type">{clientTypeLabel(client.type)}</Entry>
    <OptionalEntry label="Protocol" value={client.protocol} />
    <Entry label="Client authentication">{onOff(client.authentication.clientAuthentication)}</Entry>
    <OptionalEntry label="Authenticator" value={client.authentication.authenticator} />
    <OptionalEntry label="JWKS URL" value={client.authentication.jwksUrl} code />
    <OptionalEntry label="PKCE method" value={client.authentication.pkceMethod} />
    <Entry label="Consent required">{onOff(client.authentication.consentRequired)}</Entry>
    {client.authentication.certificateBoundAccessTokens !== undefined && (
      <Entry label="Certificate-bound access tokens">{onOff(client.authentication.certificateBoundAccessTokens)}</Entry>
    )}
    <OptionalEntry label="Root URL" value={client.urls.root} code />
    <OptionalEntry label="Home URL" value={client.urls.home} code />
    <OptionalEntry label="Admin URL" value={client.urls.admin} code />
    <Entry label="Authorization services">{onOff(client.authorizationServicesEnabled)}</Entry>
  </dl>
);

const ClientFlows: FunctionComponent<{ flows: AccessClientDetails['flows'] }> = ({ flows }) => (
  <dl data-testid="access-client-flows">
    <Entry label="Standard flow">{onOff(flows.standardFlow)}</Entry>
    <Entry label="Implicit flow">{onOff(flows.implicitFlow)}</Entry>
    <Entry label="Direct access grants">{onOff(flows.directAccessGrants)}</Entry>
    <Entry label="Service accounts">{onOff(flows.serviceAccounts)}</Entry>
    <Entry label="Device authorization grant">{onOff(flows.deviceAuthorizationGrant)}</Entry>
    <Entry label="CIBA">{onOff(flows.ciba)}</Entry>
  </dl>
);

const ClientRolesAndScopes: FunctionComponent<{ client: AccessClientDetails }> = ({ client }) => (
  <div data-testid="access-client-roles-scopes">
    <h4>Client roles</h4>
    {client.roles.length > 0 ? (
      <ul>
        {client.roles.map((role) => (
          <li key={role.name}>
            <code>{role.name}</code>
            {role.composite && ' (composite)'}
            {role.description && ` — ${role.description}`}
          </li>
        ))}
      </ul>
    ) : (
      <p>None configured.</p>
    )}
    <h4>Default client scopes</h4>
    <ValueList values={client.scopes.defaultClientScopes} />
    <h4>Optional client scopes</h4>
    <ValueList values={client.scopes.optionalClientScopes} />
    <h4>Role scope mappings</h4>
    <dl>
      <Entry label="Full scope allowed">{onOff(client.scopes.fullScopeAllowed)}</Entry>
      <Entry label="Realm roles">
        {client.scopes.realmRoleScopeMappings.length > 0 ? client.scopes.realmRoleScopeMappings.join(', ') : 'None'}
      </Entry>
      {client.scopes.clientRoleScopeMappings.map((mapping) => (
        <Entry key={mapping.clientId} label={`Roles of ${mapping.clientId}`}>
          {mapping.roles.join(', ')}
        </Entry>
      ))}
    </dl>
  </div>
);

function describeMapperTargets(settings: MapperSettings): string {
  const targets = MAPPER_TOKEN_TARGETS.filter(([key]) => settings[key] === true).map(([, label]) => label);
  return targets.length > 0 ? targets.join(', ') : 'None';
}

function describeMapperDetails(settings: MapperSettings): string {
  return MAPPER_DETAIL_LABELS.filter(([key]) => typeof settings[key] === 'string')
    .map(([key, label]) => `${label}: ${settings[key]}`)
    .join('; ');
}

const ClientProtocolMappers: FunctionComponent<{ mappers: AccessClientDetails['protocolMappers'] }> = ({ mappers }) =>
  mappers.length > 0 ? (
    <table data-testid="access-client-mappers">
      <thead>
        <tr>
          <th>Name</th>
          <th>Mapper type</th>
          <th>Claim</th>
          <th>Added to</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {mappers.map((mapper) => (
          <tr key={`${mapper.name}-${mapper.mapperType}`}>
            <td>{mapper.name}</td>
            <td>
              <code>{mapper.mapperType}</code>
            </td>
            <td>{mapper.settings.claimName ? <code>{mapper.settings.claimName}</code> : ''}</td>
            <td>{describeMapperTargets(mapper.settings)}</td>
            <td>{describeMapperDetails(mapper.settings)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p data-testid="access-client-mappers">None configured on the client. Mappers may still come from client scopes.</p>
  );

const ClientTokensAndLogout: FunctionComponent<{ client: AccessClientDetails }> = ({ client }) => (
  <dl data-testid="access-client-tokens-logout">
    <OptionalEntry label="Access token lifespan (seconds)" value={client.tokens.accessTokenLifespanSeconds} />
    <OptionalEntry label="Client session idle (seconds)" value={client.tokens.clientSessionIdleTimeoutSeconds} />
    <OptionalEntry label="Client session max (seconds)" value={client.tokens.clientSessionMaxLifespanSeconds} />
    {client.tokens.useRefreshTokens !== undefined && (
      <Entry label="Refresh tokens">{onOff(client.tokens.useRefreshTokens)}</Entry>
    )}
    <OptionalEntry label="Access token signature" value={client.tokens.accessTokenSignatureAlgorithm} />
    <OptionalEntry label="ID token signature" value={client.tokens.idTokenSignatureAlgorithm} />
    <Entry label="Front-channel logout">{onOff(client.logout.frontChannelLogout)}</Entry>
    <OptionalEntry label="Front-channel logout URL" value={client.logout.frontChannelLogoutUrl} code />
    <OptionalEntry label="Back-channel logout URL" value={client.logout.backChannelLogoutUrl} code />
    {client.logout.backChannelLogoutSessionRequired !== undefined && (
      <Entry label="Back-channel logout session required">
        {onOff(client.logout.backChannelLogoutSessionRequired)}
      </Entry>
    )}
  </dl>
);

/**
 * Shows a client's configuration grouped the way it is checked when troubleshooting. Settings that were not returned
 * are labelled as such rather than assumed.
 */
export const ClientDetails: FunctionComponent<{ client: AccessClientDetails }> = ({ client }) => (
  <div data-testid="access-client-details">
    <ClientOverview client={client} />
    <h4>Flows</h4>
    <ClientFlows flows={client.flows} />
    <h4>Valid redirect URIs</h4>
    <ValueList values={client.redirects.redirectUris} testId="access-client-redirect-uris" />
    <h4>Web origins</h4>
    <ValueList values={client.redirects.webOrigins} testId="access-client-web-origins" />
    <h4>Post-logout redirect URIs</h4>
    <ValueList values={client.redirects.postLogoutRedirectUris} />
    <details>
      <summary>Roles and scopes</summary>
      <ClientRolesAndScopes client={client} />
    </details>
    <details>
      <summary>Protocol mappers ({client.protocolMappers.length})</summary>
      <ClientProtocolMappers mappers={client.protocolMappers} />
    </details>
    <details>
      <summary>Token and logout settings</summary>
      <ClientTokensAndLogout client={client} />
    </details>
  </div>
);
