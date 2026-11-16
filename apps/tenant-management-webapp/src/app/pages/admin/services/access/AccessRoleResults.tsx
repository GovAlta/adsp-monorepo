import React, { FunctionComponent } from 'react';
import type { AccessRoleDetails, AccessRoleMember, AccessServiceRolesEntry } from '@store/agent/model';
import { describeRoleSource, ListOrNone, roleLabel } from './AccessUserResults';

const SOURCE_LABELS: Record<AccessServiceRolesEntry['source'], string> = {
  platform: 'ADSP platform',
  tenant: 'Your tenant',
};

/**
 * Lists the roles each ADSP service defines, collapsed per service, with what each role is for.
 */
export const ServiceRoleCatalog: FunctionComponent<{ services: AccessServiceRolesEntry[] }> = ({ services }) => (
  <div data-testid="access-service-roles">
    {services.map((entry) => (
      <details key={`${entry.source}:${entry.service}`} open={services.length === 1}>
        <summary>
          {entry.service} ({entry.roles.length}) · {SOURCE_LABELS[entry.source]}
        </summary>
        <ul>
          {entry.roles.map((role) => (
            <li key={role.role}>
              <code>{role.role}</code>
              {role.description && ` — ${role.description}`}
              {role.inTenantAdmin && ' (included in tenant-admin)'}
            </li>
          ))}
        </ul>
      </details>
    ))}
  </div>
);

/**
 * Explains one role: what it is for, what it includes, and which role bundles give it.
 */
export const RoleDetails: FunctionComponent<{ role: AccessRoleDetails }> = ({ role }) => (
  <div data-testid="access-role-details">
    <dl>
      <dt>Role</dt>
      <dd>
        <code>{role.name}</code>
      </dd>
      <dt>Belongs to</dt>
      <dd>{role.client ? <code>{role.client}</code> : 'The whole realm (tenant-wide role)'}</dd>
      <dt>What it is for</dt>
      <dd>{role.description ?? 'No description.'}</dd>
      <dt>Role bundle</dt>
      <dd>{role.composite ? `Yes, it includes ${role.includes.length} roles` : 'No'}</dd>
      {role.inTenantAdmin !== undefined && (
        <>
          <dt>Included in tenant-admin</dt>
          <dd>{role.inTenantAdmin ? 'Yes' : 'No'}</dd>
        </>
      )}
    </dl>
    {role.includes.length > 0 && (
      <details>
        <summary>Roles it includes ({role.includes.length})</summary>
        <ListOrNone values={role.includes.map(roleLabel)} />
      </details>
    )}
    <h4>Roles that give it</h4>
    {role.includedIn.length > 0 ? (
      <ul data-testid="access-role-included-in">
        {role.includedIn.map((parent) => (
          <li key={roleLabel(parent)}>
            <code>{roleLabel(parent)}</code>
            {parent.via.length > 1 && ` (through ${parent.via.slice(1).map(roleLabel).join(' → ')})`}
          </li>
        ))}
      </ul>
    ) : (
      <p>Only assigning this role directly, or to a group, gives it.</p>
    )}
    {role.truncated && <p>Some role bundles could not be read, so this may be incomplete.</p>}
  </div>
);

/**
 * Lists who holds a role and how, by username only.
 */
export const RoleMembers: FunctionComponent<{
  members: AccessRoleMember[];
  counts?: { direct: number; group: number; composite: number };
  truncated?: boolean;
}> = ({ members, counts, truncated }) => (
  <div data-testid="access-role-members">
    {counts && (
      <p>
        {counts.direct} assigned directly · {counts.group} through a group · {counts.composite} through a role bundle
      </p>
    )}
    {truncated && (
      <p data-testid="access-role-members-truncated">
        Only part of the list is shown: there are more holders, or some could not be read.
      </p>
    )}
    {members.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>How</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.username}>
              <td>
                <code>{member.username}</code>
                {member.serviceAccount && ' (app service account)'}
                {member.enabled === false && ' (turned off)'}
              </td>
              <td>{member.sources.map(describeRoleSource).join('; ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p>Nobody holds this role.</p>
    )}
  </div>
);
