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
    expect(isAccessDiscoveryTool('findAccessUser')).toBe(true);
    expect(isAccessDiscoveryTool('getAccessUserRoles')).toBe(true);
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

  const accessUser = {
    id: 'user-id-1',
    username: 'jdoe',
    enabled: true,
    emailVerified: true,
    requiredActions: [],
    identityProviders: ['core'],
  };

  it('shows a pending state while role assignments are read', () => {
    const { getByText } = render(<AccessToolCall toolCall={toolCall('getAccessUserRoles')} />);

    expect(getByText('Checking role assignments…')).toBeInTheDocument();
  });

  it('shows the user a lookup found', () => {
    const { getByTestId, queryByTestId, container } = render(
      <AccessToolCall
        toolCall={toolCall('findAccessUser', {
          result: {
            status: 'available',
            message: 'Found user jdoe in realm Tenant One (realm-1) in Development (read-only).',
            environment: devEnvironment,
            realm: tenantRealm,
            search: 'jdoe',
            user: accessUser,
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-findAccessUser')).toHaveAttribute('data-status', 'complete');
    expect(badgeContent(container)).toBe('Read-only');
    expect(getByTestId('access-user-identity')).toHaveTextContent('jdoe');
    expect(queryByTestId('access-user-roles')).toBeNull();
    expect(queryByTestId('access-realm-details')).toBeNull();
  });

  it("shows a user's role assignments with the user they belong to", () => {
    const { getByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('getAccessUserRoles', {
          result: {
            status: 'available',
            message: 'Role assignments of jdoe.',
            search: 'jdoe',
            user: accessUser,
            roles: {
              realmRoles: [
                {
                  name: 'role-test',
                  composite: false,
                  inherited: true,
                  sources: [
                    { type: 'composite', via: [{ name: 'tenant-admin', client: 'urn:ads:platform:tenant-service' }] },
                  ],
                },
              ],
              clientRoles: [],
              groups: [],
              counts: { direct: 0, inherited: 1 },
            },
          },
        })}
      />,
    );

    expect(getByTestId('access-user-identity')).toHaveTextContent('jdoe');
    expect(getByTestId('access-user-realm-roles')).toHaveTextContent(
      'role-testInheritedInherited via tenant-admin (urn:ads:platform:tenant-service)',
    );
  });

  it('reports a user that cannot be found and offers close-match usernames', () => {
    const { getByTestId, getByText, queryByTestId, container } = render(
      <AccessToolCall
        toolCall={toolCall('getAccessUserRoles', {
          result: {
            status: 'not-found',
            reason: 'USER_NOT_FOUND',
            message:
              'No user with that username or email could be found in your realm, or you do not have access to them.',
            search: 'jdo',
            suggestions: ['jdoe'],
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-getAccessUserRoles')).toHaveAttribute('data-status', 'notice');
    expect(badgeContent(container)).toBe('Not found');
    expect(
      getByText('No user with that username or email could be found in your realm, or you do not have access to them.'),
    ).toBeInTheDocument();
    expect(getByTestId('access-user-suggestions')).toHaveTextContent('jdoe');
    expect(queryByTestId('access-client-suggestions')).toBeNull();
    expect(queryByTestId('access-user-roles')).toBeNull();
  });

  it('explains that users cannot be inspected in Production as a notice', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('findAccessUser', {
          result: {
            status: 'unavailable',
            reason: 'USER_INSPECTION_NOT_ALLOWED',
            message: 'Users and their role assignments cannot be inspected in this environment.',
            environment: { id: 'prod', label: 'Production', host: 'https://access.alberta.ca', readOnly: true },
            search: 'jdoe',
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-findAccessUser')).toHaveAttribute('data-status', 'notice');
    expect(getByText('Users and their role assignments cannot be inspected in this environment.')).toBeInTheDocument();
    expect(queryByTestId('access-user-identity')).toBeNull();
  });

  it('shows unexpected tool errors as failures', () => {
    const { getByTestId, getByText, container } = render(
      <AccessToolCall toolCall={toolCall('getAccessRealmInfo', { error: 'Request failed with status code 400' })} />,
    );

    expect(getByTestId('access-tool-getAccessRealmInfo')).toHaveAttribute('data-status', 'error');
    expect(badgeContent(container)).toBe('Failed');
    expect(getByText('Request failed with status code 400')).toBeInTheDocument();
  });

  it.each([
    ['checkAccessClientSetup', 'App setup check'],
    ['checkAccessClientUrl', 'App address check'],
    ['previewAccessToken', 'Token preview'],
    ['getAccessServiceAccount', 'Service account'],
    ['getAccessUserSignInStatus', 'Sign-in status'],
    ['checkAccessUserForService', 'Access to a service'],
    ['compareAccessUsers', 'Access compared'],
    ['listAccessServiceRoles', 'Service roles'],
    ['getAccessRole', 'Role explained'],
    ['listAccessRoleMembers', 'Who has the role'],
  ])('renders %s as an Access card headed "%s" with a one-line summary', (toolName, heading) => {
    const { getByTestId, getByText } = render(
      <AccessToolCall
        toolCall={toolCall(toolName, {
          result: { status: 'available', message: 'Summary of the check (read-only).', environment: devEnvironment },
        })}
      />,
    );

    expect(isAccessDiscoveryTool(toolName)).toBe(true);
    expect(getByText(heading)).toBeInTheDocument();
    expect(getByTestId('access-tool-summary')).toHaveTextContent('Summary of the check (read-only).');
  });

  it('labels several matches as a choice rather than not found, and lists them', () => {
    const { container, getByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('getAccessUserSignInStatus', {
          result: {
            status: 'not-found',
            reason: 'USER_AMBIGUOUS',
            message: 'More than one user matches. Choose one of the usernames listed.',
            search: 'Jane',
            suggestions: ['jdoe', 'jdoe2'],
          },
        })}
      />,
    );

    expect(badgeContent(container)).toBe('Several matches');
    expect(getByTestId('access-user-suggestions')).toHaveTextContent('People who match (choose one):jdoejdoe2');
  });

  it('lists role choices for a role that several services define', () => {
    const { getByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('getAccessRole', {
          result: {
            status: 'not-found',
            reason: 'ROLE_AMBIGUOUS',
            message: 'More than one app or service has a role with that name.',
            suggestions: ['admin on urn:ads:demo:a', 'admin on urn:ads:demo:b'],
          },
        })}
      />,
    );

    expect(getByTestId('access-role-suggestions')).toHaveTextContent(
      'Roles with that name (choose one):admin on urn:ads:demo:aadmin on urn:ads:demo:b',
    );
  });

  it('asks to confirm a person found by searching names in its summary', () => {
    const { getByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('findAccessUser', {
          result: {
            status: 'available',
            message:
              'Found user jdoe. Matched "Jane" to username jdoe by searching names; confirm this is the person you meant.',
            matchedBy: 'search',
            user: { id: 'u-1', username: 'jdoe', requiredActions: [], identityProviders: [] },
          },
        })}
      />,
    );

    expect(getByTestId('access-tool-summary')).toHaveTextContent('confirm this is the person you meant');
  });

  it('shows the service checks of a person', () => {
    const { getByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('checkAccessUserForService', {
          result: {
            status: 'available',
            message: 'Checked jdoe.',
            services: [
              {
                service: 'urn:ads:platform:form-service',
                rolesFrom: 'platform',
                roles: [{ role: 'form-admin', has: false, sources: [] }],
                otherRoles: [],
              },
            ],
            notes: ['The token from urn:ads:demo:app could not be previewed, so it was not checked.'],
          },
        })}
      />,
    );

    expect(getByTestId('access-service-check-urn:ads:platform:form-service')).toHaveTextContent('has 0 of 1 roles');
    expect(getByTestId('access-tool-notes')).toHaveTextContent('could not be previewed');
  });

  it('shows a service account with its roles, service checks and setup values', () => {
    const { getByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('getAccessServiceAccount', {
          result: {
            status: 'available',
            message: 'Service account of urn:ads:demo:api.',
            serviceAccount: { username: 'service-account-api', enabled: true },
            roles: { realmRoles: [], clientRoles: [], groups: [], counts: { direct: 0, inherited: 0 } },
            services: [],
            setup: { issuer: 'i', tokenUrl: 't', curl: "curl 'client_secret=<client-secret>'" },
          },
        })}
      />,
    );

    expect(getByTestId('access-service-account')).toHaveTextContent('service-account-api');
    expect(getByTestId('access-user-roles')).toBeInTheDocument();
    expect(getByTestId('access-client-setup')).toHaveTextContent('<client-secret>');
  });

  it('lists the choices for each person in a comparison who was not found exactly', () => {
    const { getByTestId } = render(
      <AccessToolCall
        toolCall={toolCall('compareAccessUsers', {
          result: {
            status: 'not-found',
            reason: 'USER_AMBIGUOUS',
            message: 'More than one user matches.',
            first: { search: 'al', suggestions: ['alice', 'alan'] },
            second: { search: 'sam' },
          },
        })}
      />,
    );

    expect(getByTestId('access-comparison-suggestions')).toHaveTextContent('For “al”: alice, alan');
  });

  describe('getAccessGuide', () => {
    const tokenExpiryGuide = {
      topic: 'token-expiry',
      title: 'Token expiry',
      markdown: '## Token expiry\n\nAccess tokens last 5 minutes by default.',
    };

    function renderGuideLine(overrides: Partial<ToolCall> = {}) {
      return render(
        <>{renderAccessToolCall(toolCall('getAccessGuide', { args: { topic: 'token-expiry' }, ...overrides }))}</>,
      );
    }

    it('is not treated as a discovery tool card', () => {
      // Act
      const discovery = isAccessDiscoveryTool('getAccessGuide');

      // Assert
      expect(discovery).toBe(false);
    });

    it('is rendered instead of being left to the default chat card', () => {
      // Act
      const rendered = renderAccessToolCall(toolCall('getAccessGuide'));

      // Assert
      expect(rendered).not.toBeNull();
    });

    it('says the guide is being read while the tool runs', () => {
      // Act
      const { getByTestId } = renderGuideLine();

      // Assert
      expect(getByTestId('access-tool-getAccessGuide')).toHaveTextContent(/^Reading the Access Service guide…$/);
    });

    it('names the guide topic it read once the tool returns', () => {
      // Act
      const { getByTestId } = renderGuideLine({ result: tokenExpiryGuide });

      // Assert
      expect(getByTestId('access-tool-getAccessGuide')).toHaveTextContent(
        /^Read the Access Service guide: Token expiry$/,
      );
    });

    it('says the guide was read when the result has no title', () => {
      // Act
      const { getByTestId } = renderGuideLine({ result: { topic: 'token-expiry', markdown: '' } });

      // Assert
      expect(getByTestId('access-tool-getAccessGuide')).toHaveTextContent(/^Read the Access Service guide$/);
    });

    it('says the guide could not be read when the tool fails', () => {
      // Act
      const { getByTestId } = renderGuideLine({ error: 'Request failed with status code 503' });

      // Assert
      expect(getByTestId('access-tool-getAccessGuide')).toHaveTextContent(
        /^Could not read the Access Service guide\.$/,
      );
    });

    it('does not repeat the guide text, which the answer already shows', () => {
      // Act
      const { container } = renderGuideLine({ result: tokenExpiryGuide });

      // Assert
      expect(container).not.toHaveTextContent('Access tokens last 5 minutes by default.');
    });
  });
});
