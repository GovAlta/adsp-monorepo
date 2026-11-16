import React, { FunctionComponent } from 'react';
import type {
  AccessRoleRef,
  AccessSignInStatus,
  AccessUser,
  AccessUserAssignedRole,
  AccessUserRoleSource,
  AccessUserRoles,
} from '@store/agent/model';

const NOT_RETURNED = 'Not returned';

function yesNo(value?: boolean, yes = 'Yes', no = 'No'): string {
  if (value === undefined) {
    return NOT_RETURNED;
  }
  return value ? yes : no;
}

export function roleLabel({ name, client }: AccessRoleRef): string {
  return client ? `${name} (${client})` : name;
}

/**
 * Formats an ISO time from the agent in the viewer's locale, for example "Nov 6, 2026, 11:58 a.m.".
 */
export function formatTime(iso?: string): string {
  if (!iso) {
    return NOT_RETURNED;
  }
  const time = new Date(iso);
  return Number.isNaN(time.getTime()) ? iso : time.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Describes where a role assignment comes from in words, for example "Inherited via tenant-admin".
 */
export function describeRoleSource(source: AccessUserRoleSource): string {
  switch (source.type) {
    case 'direct':
      return 'Assigned directly';
    case 'group':
      return `Assigned to group ${source.group}`;
    case 'composite': {
      const via = `Inherited via ${(source.via ?? []).map(roleLabel).join(' → ')}`;
      return source.group ? `${via}, assigned to group ${source.group}` : via;
    }
    default:
      return 'Effective in Keycloak; source could not be traced';
  }
}

export const ListOrNone: FunctionComponent<{ values: string[] }> = ({ values }) =>
  values.length > 0 ? (
    <>
      {values.map((value, index) => (
        <React.Fragment key={value}>
          {index > 0 && ', '}
          <code>{value}</code>
        </React.Fragment>
      ))}
    </>
  ) : (
    <>None</>
  );

/**
 * Shows the details that identify a user. Email, names and other personal details are never returned by the agent.
 */
export const UserIdentity: FunctionComponent<{ user: AccessUser }> = ({ user }) => (
  <dl data-testid="access-user-identity">
    <dt>Username</dt>
    <dd>
      <code>{user.username}</code>
    </dd>
    <dt>User ID (token subject)</dt>
    <dd>
      <code>{user.id}</code>
    </dd>
    <dt>Status</dt>
    <dd>{yesNo(user.enabled, 'Enabled', 'Disabled')}</dd>
    <dt>Email verified</dt>
    <dd>{yesNo(user.emailVerified)}</dd>
    <dt>Required actions</dt>
    <dd>
      <ListOrNone values={user.requiredActions} />
    </dd>
    <dt>Identity providers</dt>
    <dd>
      <ListOrNone values={user.identityProviders} />
    </dd>
  </dl>
);

export const UserSuggestions: FunctionComponent<{ suggestions?: string[]; ambiguous?: boolean }> = ({
  suggestions,
  ambiguous,
}) =>
  suggestions?.length > 0 ? (
    <div data-testid="access-user-suggestions">
      <p>{ambiguous ? 'People who match (choose one):' : 'Usernames of close matches:'}</p>
      <ul>
        {suggestions.map((suggestion) => (
          <li key={suggestion}>
            <code>{suggestion}</code>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

const RoleTable: FunctionComponent<{ roles: AccessUserAssignedRole[]; testId?: string }> = ({ roles, testId }) =>
  roles.length > 0 ? (
    <table data-testid={testId}>
      <thead>
        <tr>
          <th>Role</th>
          <th>Assignment</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        {roles.map((role) => (
          <tr key={role.name} data-inherited={role.inherited}>
            <td>
              <code>{role.name}</code>
              {role.composite && ' (composite)'}
              {role.description && ` — ${role.description}`}
            </td>
            <td>{role.inherited ? 'Inherited' : 'Direct'}</td>
            <td>{role.sources.map(describeRoleSource).join('; ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p data-testid={testId}>None assigned.</p>
  );

/**
 * Shows a user's realm roles, then client roles grouped by client, each marked as direct or inherited with its source.
 * Client groups are collapsed because roles such as tenant-admin bring in roles from many clients.
 */
export const UserRoles: FunctionComponent<{ roles: AccessUserRoles }> = ({ roles }) => (
  <div data-testid="access-user-roles">
    <p>
      {roles.counts.direct} assigned directly · {roles.counts.inherited} inherited
    </p>
    {roles.incomplete && (
      <p data-testid="access-user-roles-incomplete">
        Some inherited roles could not be traced, so this list may be incomplete.
      </p>
    )}
    <dl>
      <dt>Groups</dt>
      <dd>
        <ListOrNone values={roles.groups} />
      </dd>
    </dl>
    <h4>Tenant-wide roles (realm roles)</h4>
    <RoleTable roles={roles.realmRoles} testId="access-user-realm-roles" />
    <h4>App roles (client roles)</h4>
    {roles.clientRoles.length > 0 ? (
      roles.clientRoles.map(({ clientId, roles: clientRoles }) => (
        <details key={clientId} data-testid={`access-user-client-roles-${clientId}`}>
          <summary>
            {clientId} ({clientRoles.length})
          </summary>
          <RoleTable roles={clientRoles} />
        </details>
      ))
    ) : (
      <p>None assigned.</p>
    )}
  </div>
);

function yesNoUnknown(value?: boolean): string {
  return yesNo(value, 'Yes', 'No');
}

function describeLockout(lockout: AccessSignInStatus['lockout']): string {
  if (!lockout) {
    return NOT_RETURNED;
  }
  if (lockout.lockedOut) {
    return lockout.lockedUntil
      ? `Locked until ${formatTime(lockout.lockedUntil)}`
      : 'Locked until an administrator unlocks it';
  }
  if (lockout.protectionOn === false) {
    return 'Not locked (lockout protection is off in your realm)';
  }
  return 'Not locked';
}

/**
 * Shows why a person can or cannot sign in, in plain words, with each part that could not be read noted.
 */
export const SignInStatus: FunctionComponent<{ signIn: AccessSignInStatus }> = ({ signIn }) => {
  const { lockout, signInMethods, sessions, history } = signIn;
  return (
    <div data-testid="access-sign-in-status">
      <dl>
        <dt>Account</dt>
        <dd>{yesNo(signIn.enabled, 'Turned on', 'Turned off')}</dd>
        <dt>Locked out</dt>
        <dd>{describeLockout(lockout)}</dd>
        {lockout?.failedAttempts > 0 && (
          <>
            <dt>Failed sign-ins</dt>
            <dd>
              {lockout.failedAttempts}
              {lockout.lastFailureAt && `, last at ${formatTime(lockout.lastFailureAt)}`}
            </dd>
          </>
        )}
        <dt>Signs in with</dt>
        <dd>
          <ListOrNone values={signInMethods.identityProviders} />
        </dd>
        <dt>Password set</dt>
        <dd>{yesNoUnknown(signInMethods.password)}</dd>
        <dt>Authenticator app</dt>
        <dd>{yesNoUnknown(signInMethods.otp)}</dd>
      </dl>
      <h4>Steps needed at next sign-in</h4>
      {signIn.requiredActions.length > 0 ? (
        <ul data-testid="access-sign-in-actions">
          {signIn.requiredActions.map(({ action, meaning }) => (
            <li key={action}>
              <code>{action}</code> — {meaning}
            </li>
          ))}
        </ul>
      ) : (
        <p>None.</p>
      )}
      {sessions && (
        <>
          <h4>Signed in now</h4>
          {sessions.length > 0 ? (
            <ul data-testid="access-sign-in-sessions">
              {sessions.map((session, index) => (
                <li key={index}>
                  {session.apps.join(', ') || 'No app'} — last active {formatTime(session.lastActive)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No active sessions.</p>
          )}
        </>
      )}
      {history && (
        <>
          <h4>Recent sign-in errors</h4>
          {history.recording === false && (
            <p data-testid="access-sign-in-not-recording">
              Your realm does not record sign-in events, so recent errors may be missing.
            </p>
          )}
          {history.recentErrors.length > 0 ? (
            <table data-testid="access-sign-in-errors">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Step</th>
                  <th>What happened</th>
                </tr>
              </thead>
              <tbody>
                {history.recentErrors.map((error, index) => (
                  <tr key={index}>
                    <td>{formatTime(error.time)}</td>
                    <td>
                      {error.step}
                      {error.app && (
                        <>
                          {' '}
                          in <code>{error.app}</code>
                        </>
                      )}
                    </td>
                    <td>
                      {error.meaning ?? 'Keycloak error'} (<code>{error.error}</code>)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>None found.</p>
          )}
        </>
      )}
      {signIn.notes.length > 0 && (
        <ul data-testid="access-sign-in-notes">
          {signIn.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
