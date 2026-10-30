import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AccessClientDetails } from '@store/agent/model';
import { ClientDetails, ClientList, ClientSuggestions } from './AccessClientResults';

const confidentialClient: AccessClientDetails = {
  clientId: 'urn:ads:tenant:demo:api',
  name: 'Demo API',
  description: 'Server-to-server client',
  enabled: true,
  type: 'confidential',
  protocol: 'openid-connect',
  builtIn: false,
  urls: { root: 'https://api.alberta.ca' },
  authentication: {
    clientAuthentication: true,
    authenticator: 'Client ID and secret',
    consentRequired: false,
    certificateBoundAccessTokens: true,
  },
  flows: {
    standardFlow: false,
    implicitFlow: false,
    directAccessGrants: false,
    serviceAccounts: true,
    deviceAuthorizationGrant: false,
    ciba: false,
  },
  redirects: { redirectUris: [], webOrigins: [], postLogoutRedirectUris: [] },
  roles: [
    { name: 'admin', composite: true },
    { name: 'reader', description: 'Can read', composite: false },
  ],
  scopes: {
    defaultClientScopes: ['profile', 'roles'],
    optionalClientScopes: ['offline_access'],
    fullScopeAllowed: false,
    realmRoleScopeMappings: ['offline_access'],
    clientRoleScopeMappings: [{ clientId: 'urn:ads:platform:form-service', roles: ['form-applicant'] }],
  },
  protocolMappers: [
    {
      name: 'form audience',
      mapperType: 'oidc-audience-mapper',
      protocol: 'openid-connect',
      settings: {
        includedClientAudience: 'urn:ads:platform:form-service',
        addToAccessToken: true,
        addToIdToken: false,
      },
    },
  ],
  tokens: { accessTokenLifespanSeconds: 300, useRefreshTokens: false },
  logout: { frontChannelLogout: false, backChannelLogoutUrl: 'https://api.alberta.ca/logout' },
  authorizationServicesEnabled: false,
};

function definitionValue(container: HTMLElement, term: string): string | null {
  const dt = Array.from(container.querySelectorAll('dt')).find((element) => element.textContent === term);
  return dt?.nextElementSibling?.textContent ?? null;
}

describe('ClientList', () => {
  it('lists each client with its type and status, and marks Keycloak built-in clients', () => {
    const { getAllByRole } = render(
      <ClientList
        clients={[
          {
            clientId: 'urn:ads:tenant:demo:web-app',
            name: 'Demo web app',
            type: 'public',
            enabled: true,
            builtIn: false,
          },
          { clientId: 'realm-management', type: 'bearer-only', enabled: false, builtIn: true },
          { clientId: 'limited', builtIn: false },
        ]}
      />,
    );

    expect(
      getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent),
    ).toEqual([
      'urn:ads:tenant:demo:web-appDemo web appPublicEnabled',
      'realm-management (Keycloak built-in)Bearer-onlyDisabled',
      'limitedNot returnedNot returned',
    ]);
  });

  it('says when only some of the clients are shown', () => {
    const { getByText } = render(<ClientList clients={[{ clientId: 'app', builtIn: false }]} truncated />);

    expect(
      getByText('Only the first 1 clients are shown. Search by client ID to narrow the list.'),
    ).toBeInTheDocument();
  });

  it('shows the returned message when there are no clients', () => {
    const { getByTestId, queryByTestId } = render(<ClientList clients={[]} message="No clients were returned." />);

    expect(getByTestId('access-clients-empty')).toHaveTextContent('No clients were returned.');
    expect(queryByTestId('access-clients-table')).toBeNull();
  });
});

describe('ClientSuggestions', () => {
  it('shows nothing when there are no suggestions', () => {
    const { container } = render(<ClientSuggestions suggestions={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('ClientDetails', () => {
  it('shows the client type, authentication and flows', () => {
    const { getByTestId } = render(<ClientDetails client={confidentialClient} />);
    const overview = getByTestId('access-client-overview');
    const flows = getByTestId('access-client-flows');

    expect(definitionValue(overview, 'Type')).toBe('Confidential');
    expect(definitionValue(overview, 'Client authentication')).toBe('On');
    expect(definitionValue(overview, 'Authenticator')).toBe('Client ID and secret');
    expect(definitionValue(overview, 'Certificate-bound access tokens')).toBe('On');
    expect(definitionValue(overview, 'PKCE method')).toBeNull();
    expect(definitionValue(flows, 'Standard flow')).toBe('Off');
    expect(definitionValue(flows, 'Service accounts')).toBe('On');
  });

  it('says when no redirect URIs or web origins are configured', () => {
    const { getByTestId } = render(<ClientDetails client={confidentialClient} />);

    expect(getByTestId('access-client-redirect-uris')).toHaveTextContent('None configured.');
    expect(getByTestId('access-client-web-origins')).toHaveTextContent('None configured.');
  });

  it('shows client roles, client scopes and role scope mappings', () => {
    const { getByTestId } = render(<ClientDetails client={confidentialClient} />);
    const rolesAndScopes = getByTestId('access-client-roles-scopes');

    expect(rolesAndScopes).toHaveTextContent('admin (composite)');
    expect(rolesAndScopes).toHaveTextContent('reader — Can read');
    expect(rolesAndScopes).toHaveTextContent('offline_access');
    expect(definitionValue(rolesAndScopes, 'Full scope allowed')).toBe('Off');
    expect(definitionValue(rolesAndScopes, 'Roles of urn:ads:platform:form-service')).toBe('form-applicant');
  });

  it('shows protocol mappers with the tokens they add claims to', () => {
    const { getByTestId } = render(<ClientDetails client={confidentialClient} />);

    expect(getByTestId('access-client-mappers').querySelector('tbody tr')?.textContent).toBe(
      'form audienceoidc-audience-mapperAccess tokenAudience: urn:ads:platform:form-service',
    );
  });

  it('shows token and logout settings that are set', () => {
    const { getByTestId } = render(<ClientDetails client={confidentialClient} />);
    const tokensAndLogout = getByTestId('access-client-tokens-logout');

    expect(definitionValue(tokensAndLogout, 'Access token lifespan (seconds)')).toBe('300');
    expect(definitionValue(tokensAndLogout, 'Refresh tokens')).toBe('Off');
    expect(definitionValue(tokensAndLogout, 'Back-channel logout URL')).toBe('https://api.alberta.ca/logout');
    expect(definitionValue(tokensAndLogout, 'ID token signature')).toBeNull();
  });

  it('labels settings that were not returned instead of assuming them', () => {
    const { getByTestId } = render(
      <ClientDetails
        client={{
          ...confidentialClient,
          enabled: undefined,
          type: undefined,
          authentication: {},
          flows: { deviceAuthorizationGrant: false, ciba: false },
          protocolMappers: [],
        }}
      />,
    );

    expect(definitionValue(getByTestId('access-client-overview'), 'Status')).toBe('Not returned');
    expect(definitionValue(getByTestId('access-client-overview'), 'Type')).toBe('Not returned');
    expect(definitionValue(getByTestId('access-client-flows'), 'Standard flow')).toBe('Not returned');
    expect(getByTestId('access-client-mappers')).toHaveTextContent('None configured on the client.');
  });
});
