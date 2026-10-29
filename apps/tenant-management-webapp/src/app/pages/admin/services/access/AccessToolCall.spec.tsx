import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ToolCall } from '@core-services/app-common';
import { AccessToolCall, isAccessDiscoveryTool, renderAccessToolCall } from './AccessToolCall';

const devEnvironment = { id: 'dev', label: 'Development', host: 'https://access.adsp-dev.gov.ab.ca', readOnly: true };
const tenantRealm = { realm: 'realm-1', name: 'Tenant One', kind: 'tenant', status: 'active' };

const clientDetails = {
  clientId: 'urn:ads:tenant:demo:web-app',
  name: 'Demo web app',
  enabled: true,
  type: 'public',
  protocol: 'openid-connect',
  builtIn: false,
  urls: { root: 'https://demo.alberta.ca' },
  authentication: { clientAuthentication: false, consentRequired: false, pkceMethod: 'S256' },
  flows: {
    standardFlow: true,
    implicitFlow: false,
    directAccessGrants: false,
    serviceAccounts: false,
    deviceAuthorizationGrant: false,
    ciba: false,
  },
  redirects: {
    redirectUris: ['https://demo.alberta.ca/*'],
    webOrigins: ['https://demo.alberta.ca'],
    postLogoutRedirectUris: [],
  },
  roles: [],
  scopes: {
    defaultClientScopes: ['profile'],
    optionalClientScopes: [],
    fullScopeAllowed: true,
    realmRoleScopeMappings: [],
    clientRoleScopeMappings: [],
  },
  protocolMappers: [],
  tokens: {},
  logout: { frontChannelLogout: true },
  authorizationServicesEnabled: false,
};

function toolCall(toolName: string, overrides: Partial<ToolCall> = {}): ToolCall {
  return { toolCallId: `${toolName}-1`, toolName, args: {}, ...overrides };
}

function badgeContent(container: HTMLElement): string | null {
  return container.querySelector('goa-badge')?.getAttribute('content') ?? null;
}

describe('AccessToolCall', () => {
  it('recognizes only the Access Service discovery tools', () => {
    expect(isAccessDiscoveryTool('listAccessEnvironments')).toBe(true);
    expect(isAccessDiscoveryTool('listAccessRealms')).toBe(true);
    expect(isAccessDiscoveryTool('getAccessRealmInfo')).toBe(true);
    expect(isAccessDiscoveryTool('listAccessClients')).toBe(true);
    expect(isAccessDiscoveryTool('getAccessClient')).toBe(true);
    expect(isAccessDiscoveryTool('agent-clientAgent')).toBe(false);
    expect(isAccessDiscoveryTool('toString')).toBe(false);
    expect(isAccessDiscoveryTool(undefined)).toBe(false);
  });

  it('leaves other tool calls to the default chat card so they are not hidden', () => {
    expect(renderAccessToolCall(toolCall('agent-clientAgent'))).toBeNull();
    expect(renderAccessToolCall(toolCall('listAccessRealms'))).not.toBeNull();
  });

  it('shows a pending state while the tool runs', () => {
    const { getByTestId, getByText, container } = render(<AccessToolCall toolCall={toolCall('listAccessRealms')} />);

    expect(getByTestId('access-tool-listAccessRealms')).toHaveAttribute('data-status', 'pending');
    expect(getByText('Checking realms…')).toBeInTheDocument();
    expect(badgeContent(container)).toBeNull();
  });

  it('shows all environments and marks the inspectable one as read-only', () => {
    const { getByTestId, getAllByRole, container } = render(
      <AccessToolCall
        toolCall={toolCall('listAccessEnvironments', {
          result: {
            status: 'available',
            message: 'This session is signed in to Development.',
            environments: [
              { ...devEnvironment, current: true, inspectable: true },
              {
                id: 'uat',
                label: 'UAT',
                host: 'https://access-uat.alberta.ca',
                readOnly: true,
                current: false,
                inspectable: false,
              },
              {
                id: 'prod',
                label: 'Production',
                host: 'https://access.alberta.ca',
                readOnly: true,
                current: false,
                inspectable: false,
              },
            ],
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-listAccessEnvironments')).toHaveAttribute('data-status', 'complete');
    expect(badgeContent(container)).toBe('Read-only');

    const rows = getAllByRole('row').slice(1);
    expect(rows.map((row) => row.textContent)).toEqual([
      'Developmenthttps://access.adsp-dev.gov.ab.caCan inspectRead-only',
      'UAThttps://access-uat.alberta.caNot from this sessionRead-only',
      'Productionhttps://access.alberta.caNot from this sessionRead-only',
    ]);
  });

  it('explains a missing role as a notice rather than a failure', () => {
    const { getByTestId, getByText, container } = render(
      <AccessToolCall
        toolCall={toolCall('listAccessEnvironments', {
          result: {
            status: 'unavailable',
            reason: 'MISSING_ROLE',
            missingRoles: ['urn:ads:platform:agent-service:agent-user'],
            message: 'You do not have the role needed to inspect the Access Service.',
            environments: [{ ...devEnvironment, current: true, inspectable: false }],
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-listAccessEnvironments')).toHaveAttribute('data-status', 'notice');
    expect(badgeContent(container)).toBe('Not available');
    expect(getByText('You do not have the role needed to inspect the Access Service.')).toBeInTheDocument();
    expect(getByText('urn:ads:platform:agent-service:agent-user')).toBeInTheDocument();
    expect(getByTestId('access-environments-table')).toBeInTheDocument();
  });

  it('lists the realms the user can inspect', () => {
    const { getByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('listAccessRealms', {
          result: {
            status: 'available',
            message: 'You can inspect 1 realm.',
            environment: devEnvironment,
            realms: [{ realm: 'realm-1', name: 'Tenant One', kind: 'tenant', status: 'active' }],
          },
        })}
      />,
    );

    expect(getByTestId('access-realms-list')).toHaveTextContent('Tenant One — realm-1 (Tenant, active)');
  });

  it('shows realm details and omits endpoints that were not returned', () => {
    const { getByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('getAccessRealmInfo', {
          result: {
            status: 'available',
            message: 'Realm is reachable.',
            environment: devEnvironment,
            realm: {
              realm: 'realm-1',
              name: 'Tenant One',
              kind: 'tenant',
              issuer: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1',
              endpoints: { token: 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/token' },
            },
          },
        })}
      />,
    );

    const details = getByTestId('access-realm-details');
    expect(details).toHaveTextContent('Environment');
    expect(details).toHaveTextContent('Development');
    expect(details).toHaveTextContent('https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1');
    expect(details).toHaveTextContent('Token endpoint');
    expect(details).not.toHaveTextContent('Authorization endpoint');
  });

  it('reports a realm that cannot be found without showing details', () => {
    const { getByTestId, getByText, queryByTestId, container } = render(
      <AccessToolCall
        toolCall={toolCall('getAccessRealmInfo', {
          result: {
            status: 'not-found',
            reason: 'REALM_NOT_FOUND',
            message: 'The realm could not be found or you do not have access to it.',
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-getAccessRealmInfo')).toHaveAttribute('data-status', 'notice');
    expect(badgeContent(container)).toBe('Not found');
    expect(getByText('The realm could not be found or you do not have access to it.')).toBeInTheDocument();
    expect(queryByTestId('access-realm-details')).toBeNull();
  });

  it('shows a pending state while client configuration is read', () => {
    const { getByText } = render(<AccessToolCall toolCall={toolCall('getAccessClient')} />);

    expect(getByText('Checking client configuration…')).toBeInTheDocument();
  });

  it('lists the clients in the realm without showing realm details', () => {
    const { getByTestId, queryByTestId, container } = render(
      <AccessToolCall
        toolCall={toolCall('listAccessClients', {
          result: {
            status: 'available',
            message: 'Found 2 clients.',
            environment: devEnvironment,
            realm: tenantRealm,
            clients: [
              {
                clientId: 'urn:ads:tenant:demo:web-app',
                name: 'Demo web app',
                type: 'public',
                enabled: true,
                builtIn: false,
              },
              { clientId: 'realm-management', type: 'bearer-only', enabled: true, builtIn: true },
            ],
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-listAccessClients')).toHaveAttribute('data-status', 'complete');
    expect(badgeContent(container)).toBe('Read-only');
    expect(getByTestId('access-clients-table')).toHaveTextContent('urn:ads:tenant:demo:web-app');
    expect(queryByTestId('access-realm-details')).toBeNull();
  });

  it('shows the configuration of a client without showing realm details', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('getAccessClient', {
          result: {
            status: 'available',
            message: 'Client urn:ads:tenant:demo:web-app (read-only).',
            environment: devEnvironment,
            realm: tenantRealm,
            clientId: 'urn:ads:tenant:demo:web-app',
            client: clientDetails,
          },
        })}
      />,
    );

    expect(getByText('Client configuration')).toBeInTheDocument();
    expect(getByTestId('access-client-details')).toBeInTheDocument();
    expect(getByTestId('access-client-redirect-uris')).toHaveTextContent('https://demo.alberta.ca/*');
    expect(queryByTestId('access-realm-details')).toBeNull();
  });

  it('reports a client that cannot be found and offers similar client IDs', () => {
    const { getByTestId, getByText, queryByTestId, container } = render(
      <AccessToolCall
        toolCall={toolCall('getAccessClient', {
          result: {
            status: 'not-found',
            reason: 'CLIENT_NOT_FOUND',
            message: 'No client with that client ID could be found in your realm, or you do not have access to it.',
            environment: devEnvironment,
            realm: tenantRealm,
            clientId: 'web-app',
            suggestions: ['urn:ads:tenant:demo:web-app'],
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-getAccessClient')).toHaveAttribute('data-status', 'notice');
    expect(badgeContent(container)).toBe('Not found');
    expect(
      getByText('No client with that client ID could be found in your realm, or you do not have access to it.'),
    ).toBeInTheDocument();
    expect(getByTestId('access-client-suggestions')).toHaveTextContent('urn:ads:tenant:demo:web-app');
    expect(queryByTestId('access-client-details')).toBeNull();
  });

  it('explains missing client permission as a notice', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('listAccessClients', {
          result: {
            status: 'unavailable',
            reason: 'NO_CLIENT_PERMISSION',
            message: 'You do not have permission to view clients in this realm.',
            clients: [],
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-listAccessClients')).toHaveAttribute('data-status', 'notice');
    expect(getByText('You do not have permission to view clients in this realm.')).toBeInTheDocument();
    expect(queryByTestId('access-clients-table')).toBeNull();
    expect(queryByTestId('access-clients-empty')).toBeNull();
  });

  it('shows unexpected tool errors as failures', () => {
    const { getByTestId, getByText, container } = render(
      <AccessToolCall toolCall={toolCall('getAccessRealmInfo', { error: 'Request failed with status code 400' })} />,
    );

    expect(getByTestId('access-tool-getAccessRealmInfo')).toHaveAttribute('data-status', 'error');
    expect(badgeContent(container)).toBe('Failed');
    expect(getByText('Request failed with status code 400')).toBeInTheDocument();
  });
});
