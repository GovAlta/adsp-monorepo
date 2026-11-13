import React, { FunctionComponent } from 'react';
import type {
  AccessComparedPerson,
  AccessComparedRole,
  AccessServiceCheck,
  AccessUserComparison,
} from '@store/agent/model';
import { describeRoleSource, ListOrNone, roleLabel } from './AccessUserResults';

const ROLES_FROM_LABELS: Record<AccessServiceCheck['rolesFrom'], string> = {
  platform: 'ADSP platform service',
  tenant: 'Service registered by your tenant',
  client: 'Roles read from the Keycloak client',
};

function inTokenLabel(inToken?: boolean): string | null {
  if (inToken === undefined) {
    return null;
  }
  return inToken ? 'Yes' : 'No';
}

/**
 * Shows, for each service, every role it defines with whether the person or service account has it and how.
 */
export const ServiceChecks: FunctionComponent<{ services: AccessServiceCheck[] }> = ({ services }) => (
  <div data-testid="access-service-checks">
    {services.map((check) => {
      const showToken = check.roles.some((role) => role.inToken !== undefined);
      return (
        <div key={check.service} data-testid={`access-service-check-${check.service}`}>
          <h4>
            <code>{check.service}</code>
          </h4>
          <p>
            {ROLES_FROM_LABELS[check.rolesFrom]} · has {check.roles.filter((role) => role.has).length} of{' '}
            {check.roles.length} roles
          </p>
          {check.token && (
            <p data-testid="access-service-check-audience">
              Token from <code>{check.token.app}</code>{' '}
              {check.token.audienceIncluded
                ? 'is meant for this service (audience included).'
                : 'is not meant for this service (audience missing), so the service will refuse it.'}
            </p>
          )}
          {check.roles.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Has it?</th>
                  <th>How</th>
                  {showToken && <th>In token?</th>}
                </tr>
              </thead>
              <tbody>
                {check.roles.map((role) => (
                  <tr key={role.role} data-has={role.has}>
                    <td>
                      <code>{role.role}</code>
                      {role.description && ` — ${role.description}`}
                      {role.inTenantAdmin && ' (included in tenant-admin)'}
                    </td>
                    <td>{role.has ? 'Yes' : 'No'}</td>
                    <td>{role.sources.map(describeRoleSource).join('; ') || '—'}</td>
                    {showToken && <td>{inTokenLabel(role.inToken)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>This service defines no roles.</p>
          )}
          {check.otherRoles.length > 0 && (
            <p>
              Other roles held on this service:{' '}
              {check.otherRoles
                .map((role) => `${role.role} (${role.sources.map(describeRoleSource).join('; ')})`)
                .join(', ')}
            </p>
          )}
        </div>
      );
    })}
  </div>
);

const ComparedRoles: FunctionComponent<{ roles: AccessComparedRole[]; testId: string }> = ({ roles, testId }) =>
  roles.length > 0 ? (
    <ul data-testid={testId}>
      {roles.map((role) => (
        <li key={roleLabel(role)}>
          <code>{roleLabel(role)}</code> — {role.sources.map(describeRoleSource).join('; ')}
        </li>
      ))}
    </ul>
  ) : (
    <p data-testid={testId}>None.</p>
  );

function personLabel(person: AccessComparedPerson): string {
  return person.user?.username ?? person.search;
}

/**
 * Shows only the access one of two people has and the other does not.
 */
export const UserComparison: FunctionComponent<{
  first: AccessComparedPerson;
  second: AccessComparedPerson;
  comparison: AccessUserComparison;
}> = ({ first, second, comparison }) => (
  <div data-testid="access-user-comparison">
    <p>
      {comparison.sharedCount} roles in common.
      {comparison.truncated && ' Some roles could not be traced or the lists were cut short.'}
    </p>
    <h4>Only {personLabel(first)} has</h4>
    <ComparedRoles roles={comparison.onlyFirst} testId="access-comparison-only-first" />
    <h4>Only {personLabel(second)} has</h4>
    <ComparedRoles roles={comparison.onlySecond} testId="access-comparison-only-second" />
    {(comparison.groups.onlyFirst.length > 0 || comparison.groups.onlySecond.length > 0) && (
      <dl>
        <dt>Groups only {personLabel(first)} is in</dt>
        <dd>
          <ListOrNone values={comparison.groups.onlyFirst} />
        </dd>
        <dt>Groups only {personLabel(second)} is in</dt>
        <dd>
          <ListOrNone values={comparison.groups.onlySecond} />
        </dd>
      </dl>
    )}
  </div>
);

/**
 * Lists the usernames to choose from for each person in a comparison who could not be found exactly.
 */
export const ComparedPeopleSuggestions: FunctionComponent<{ people: AccessComparedPerson[] }> = ({ people }) => {
  const unresolved = people.filter((person) => person.suggestions?.length > 0);
  return unresolved.length > 0 ? (
    <div data-testid="access-comparison-suggestions">
      {unresolved.map((person) => (
        <p key={person.search}>
          For “{person.search}”: <ListOrNone values={person.suggestions} />
        </p>
      ))}
    </div>
  ) : null;
};
