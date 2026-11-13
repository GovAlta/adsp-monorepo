import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AccessSignInStatus, AccessUser, AccessUserRoles } from '@store/agent/model';
import {
  describeRoleSource,
  formatTime,
  SignInStatus,
  UserIdentity,
  UserRoles,
  UserSuggestions,
} from './AccessUserResults';

const TENANT_SERVICE = 'urn:ads:platform:tenant-service';

const user: AccessUser = {
  id: 'user-id-1',
  username: 'jdoe',
  enabled: true,
  emailVerified: false,
  requiredActions: ['VERIFY_EMAIL'],
  identityProviders: ['core', 'goa-ad'],
};

const roles: AccessUserRoles = {
  realmRoles: [
    { name: 'default-roles-realm-1', composite: true, inherited: false, sources: [{ type: 'direct' }] },
    {
      name: 'role-test',
      composite: false,
      inherited: true,
      sources: [{ type: 'composite', via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] }],
    },
  ],
  clientRoles: [
    {
      clientId: 'account',
      roles: [
        {
          name: 'manage-account-links',
          composite: false,
          inherited: true,
          sources: [
            {
              type: 'composite',
              via: [{ name: 'default-roles-realm-1' }, { name: 'manage-account', client: 'account' }],
            },
          ],
        },
      ],
    },
    {
      clientId: TENANT_SERVICE,
      roles: [
        {
          name: 'tenant-admin',
          description: 'Tenant administrator',
          composite: true,
          inherited: true,
          sources: [{ type: 'group', group: '/tenant-admins' }],
        },
      ],
    },
  ],
  groups: ['/tenant-admins'],
  counts: { direct: 1, inherited: 3 },
};

function definitionValue(container: HTMLElement, term: string): string | null {
  const dt = Array.from(container.querySelectorAll('dt')).find((element) => element.textContent === term);
  return dt?.nextElementSibling?.textContent ?? null;
}

describe('describeRoleSource', () => {
  it.each([
    [{ type: 'direct' }, 'Assigned directly'],
    [{ type: 'group', group: '/tenant-admins' }, 'Assigned to group /tenant-admins'],
    [
      { type: 'composite', via: [{ name: 'default-roles-realm-1' }, { name: 'manage-account', client: 'account' }] },
      'Inherited via default-roles-realm-1 → manage-account (account)',
    ],
    [
      { type: 'composite', group: '/tenant-admins', via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] },
      `Inherited via tenant-admin (${TENANT_SERVICE}), assigned to group /tenant-admins`,
    ],
    [{ type: 'unresolved' }, 'Effective in Keycloak; source could not be traced'],
  ] as const)('describes %j', (source, text) => {
    expect(describeRoleSource(source)).toBe(text);
  });
});

describe('UserIdentity', () => {
  it('shows the details that identify the user', () => {
    const { container } = render(<UserIdentity user={user} />);

    expect(definitionValue(container, 'Username')).toBe('jdoe');
    expect(definitionValue(container, 'User ID (token subject)')).toBe('user-id-1');
    expect(definitionValue(container, 'Status')).toBe('Enabled');
    expect(definitionValue(container, 'Email verified')).toBe('No');
    expect(definitionValue(container, 'Required actions')).toBe('VERIFY_EMAIL');
    expect(definitionValue(container, 'Identity providers')).toBe('core, goa-ad');
  });

  it('labels flags that were not returned and empty lists', () => {
    const { container } = render(
      <UserIdentity user={{ id: 'id-1', username: 'jdoe', requiredActions: [], identityProviders: [] }} />,
    );

    expect(definitionValue(container, 'Status')).toBe('Not returned');
    expect(definitionValue(container, 'Email verified')).toBe('Not returned');
    expect(definitionValue(container, 'Required actions')).toBe('None');
  });
});

describe('UserSuggestions', () => {
  it('lists close-match usernames', () => {
    const { getByTestId } = render(<UserSuggestions suggestions={['jdoe', 'jdoe2']} />);

    expect(getByTestId('access-user-suggestions')).toHaveTextContent('Usernames of close matches:jdoejdoe2');
  });

  it('asks to choose when several people match', () => {
    const { getByTestId } = render(<UserSuggestions suggestions={['jdoe', 'jdoe2']} ambiguous />);

    expect(getByTestId('access-user-suggestions')).toHaveTextContent('People who match (choose one):jdoejdoe2');
  });

  it('renders nothing without suggestions', () => {
    const { container } = render(<UserSuggestions suggestions={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('UserRoles', () => {
  it('summarizes direct and inherited counts and lists the groups', () => {
    const { getByTestId, container } = render(<UserRoles roles={roles} />);

    expect(getByTestId('access-user-roles')).toHaveTextContent('1 assigned directly · 3 inherited');
    expect(definitionValue(container, 'Groups')).toBe('/tenant-admins');
  });

  it('marks realm roles as direct or inherited with their source', () => {
    const { getByTestId } = render(<UserRoles roles={roles} />);

    const rows = Array.from(getByTestId('access-user-realm-roles').querySelectorAll('tbody tr')).map((row) =>
      Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent),
    );
    expect(rows).toEqual([
      ['default-roles-realm-1 (composite)', 'Direct', 'Assigned directly'],
      ['role-test', 'Inherited', `Inherited via tenant-admin (${TENANT_SERVICE})`],
    ]);
  });

  it('groups client roles by client in collapsed sections', () => {
    const { getByTestId } = render(<UserRoles roles={roles} />);

    const tenantService = getByTestId(`access-user-client-roles-${TENANT_SERVICE}`);
    expect(tenantService.tagName).toBe('DETAILS');
    expect(tenantService).not.toHaveAttribute('open');
    expect(tenantService.querySelector('summary')).toHaveTextContent(`${TENANT_SERVICE} (1)`);
    expect(tenantService).toHaveTextContent('tenant-admin (composite) — Tenant administrator');
    expect(tenantService).toHaveTextContent('Assigned to group /tenant-admins');
  });

  it('warns when inherited roles could not all be traced', () => {
    const { getByTestId, queryByTestId, rerender } = render(<UserRoles roles={roles} />);
    expect(queryByTestId('access-user-roles-incomplete')).toBeNull();

    rerender(<UserRoles roles={{ ...roles, incomplete: true }} />);

    expect(getByTestId('access-user-roles-incomplete')).toHaveTextContent('may be incomplete');
  });

  it('says when no roles are assigned', () => {
    const { getByTestId, getByText } = render(
      <UserRoles roles={{ realmRoles: [], clientRoles: [], groups: [], counts: { direct: 0, inherited: 0 } }} />,
    );

    expect(getByTestId('access-user-realm-roles')).toHaveTextContent('None assigned.');
    expect(getByText('App roles (client roles)').nextElementSibling).toHaveTextContent('None assigned.');
  });
});

describe('formatTime', () => {
  it('formats an ISO time and passes through text it cannot read', () => {
    expect(formatTime('2026-11-06T12:00:00.000Z')).toContain('2026');
    expect(formatTime('not a time')).toBe('not a time');
    expect(formatTime()).toBe('Not returned');
  });
});

describe('SignInStatus', () => {
  const signIn: AccessSignInStatus = {
    enabled: true,
    lockout: { protectionOn: true, lockedOut: true, failedAttempts: 5, lastFailureAt: '2026-11-06T11:59:00.000Z' },
    requiredActions: [{ action: 'VERIFY_EMAIL', meaning: 'Must confirm their email address.' }],
    signInMethods: { identityProviders: ['goa-ad'], password: false, otp: false },
    sessions: [{ lastActive: '2026-11-06T11:00:00.000Z', apps: ['urn:ads:platform:tenant-admin-app'] }],
    history: {
      recording: true,
      recentErrors: [
        {
          time: '2026-11-06T11:58:00.000Z',
          step: 'Sign-in',
          error: 'invalid_user_credentials',
          meaning: 'The password was wrong.',
          app: 'urn:ads:demo:app',
        },
      ],
    },
    notes: [],
  };

  it('explains the account, lockout, pending steps, sessions and recent errors in plain words', () => {
    const { container, getByTestId } = render(<SignInStatus signIn={signIn} />);

    expect(definitionValue(container, 'Account')).toBe('Turned on');
    expect(definitionValue(container, 'Locked out')).toBe('Locked until an administrator unlocks it');
    expect(definitionValue(container, 'Failed sign-ins')).toContain('5, last at');
    expect(definitionValue(container, 'Signs in with')).toBe('goa-ad');
    expect(definitionValue(container, 'Password set')).toBe('No');
    expect(getByTestId('access-sign-in-actions')).toHaveTextContent('VERIFY_EMAIL — Must confirm their email address.');
    expect(getByTestId('access-sign-in-sessions')).toHaveTextContent('urn:ads:platform:tenant-admin-app — last active');
    expect(getByTestId('access-sign-in-errors')).toHaveTextContent(
      'Sign-in in urn:ads:demo:appThe password was wrong. (invalid_user_credentials)',
    );
  });

  it('says when lockout protection is off and when sign-in events are not recorded', () => {
    const { container, getByTestId } = render(
      <SignInStatus
        signIn={{
          ...signIn,
          lockout: { protectionOn: false, lockedOut: false },
          history: { recording: false, recentErrors: [] },
        }}
      />,
    );

    expect(definitionValue(container, 'Locked out')).toBe('Not locked (lockout protection is off in your realm)');
    expect(getByTestId('access-sign-in-not-recording')).toBeInTheDocument();
  });

  it('lists the parts that could not be read', () => {
    const { getByTestId, queryByTestId } = render(
      <SignInStatus
        signIn={{ ...signIn, sessions: undefined, history: undefined, notes: ['Active sessions could not be read.'] }}
      />,
    );

    expect(queryByTestId('access-sign-in-sessions')).toBeNull();
    expect(getByTestId('access-sign-in-notes')).toHaveTextContent('Active sessions could not be read.');
  });
});
