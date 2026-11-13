import { checkServiceRoles, compareRoleAssignments, MAX_COMPARED_ROLES } from './accessCheck';
import type { ResolvedRole, ResolvedRoleAssignments } from './roleAssignments';

const FORM_SERVICE = 'urn:ads:platform:form-service';
const TENANT_SERVICE = 'urn:ads:platform:tenant-service';
const viaTenantAdmin = { type: 'composite' as const, via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] };

function role(name: string, client?: string, sources: ResolvedRole['sources'] = [{ type: 'direct' }]): ResolvedRole {
  return { id: `${client}:${name}`, name, ...(client ? { client } : {}), composite: false, sources };
}

function assignments(roles: ResolvedRole[], groups: string[] = []): ResolvedRoleAssignments {
  return { roles, groups, incomplete: false };
}

const definitions = {
  service: FORM_SERVICE,
  rolesFrom: 'platform' as const,
  roles: [
    { role: 'form-admin', description: 'Administers forms.', inTenantAdmin: true },
    { role: 'form-applicant', inTenantAdmin: false },
  ],
};

describe('checkServiceRoles', () => {
  it('marks each service role as held or missing, with how it is held', () => {
    const user = assignments([
      role('form-admin', FORM_SERVICE, [viaTenantAdmin]),
      role('form-tester', FORM_SERVICE),
      role('form-applicant', 'urn:ads:platform:other-service'),
    ]);

    expect(checkServiceRoles(definitions, user)).toEqual({
      service: FORM_SERVICE,
      rolesFrom: 'platform',
      roles: [
        {
          role: 'form-admin',
          description: 'Administers forms.',
          inTenantAdmin: true,
          has: true,
          sources: [viaTenantAdmin],
        },
        { role: 'form-applicant', inTenantAdmin: false, has: false, sources: [] },
      ],
      otherRoles: [{ role: 'form-tester', sources: [{ type: 'direct' }] }],
    });
  });

  it("says whether each role and the service's audience reach the app's token", () => {
    const user = assignments([role('form-admin', FORM_SERVICE)]);
    const claims = {
      aud: ['account', 'urn:ads:platform:status-service'],
      resource_access: { [FORM_SERVICE]: { roles: ['form-applicant'] } },
    };

    const result = checkServiceRoles(definitions, user, { app: 'urn:ads:demo:app', claims });

    expect(result.roles.map(({ role: name, has, inToken }) => ({ name, has, inToken }))).toEqual([
      { name: 'form-admin', has: true, inToken: false },
      { name: 'form-applicant', has: false, inToken: true },
    ]);
    expect(result.token).toEqual({ app: 'urn:ads:demo:app', audienceIncluded: false });
  });

  it('accepts a single audience string', () => {
    const result = checkServiceRoles(definitions, assignments([]), { app: 'app', claims: { aud: FORM_SERVICE } });

    expect(result.token?.audienceIncluded).toBe(true);
  });
});

describe('compareRoleAssignments', () => {
  it('lists only the roles and groups one person has, and counts the shared roles', () => {
    const first = assignments(
      [
        role('offline_access'),
        role('form-admin', FORM_SERVICE, [viaTenantAdmin]),
        role('tenant-admin', TENANT_SERVICE),
      ],
      ['/tenant-admins', '/staff'],
    );
    const second = assignments([role('offline_access'), role('form-applicant', FORM_SERVICE)], ['/staff']);

    expect(compareRoleAssignments(first, second)).toEqual({
      onlyFirst: [
        { name: 'form-admin', client: FORM_SERVICE, sources: [viaTenantAdmin] },
        { name: 'tenant-admin', client: TENANT_SERVICE, sources: [{ type: 'direct' }] },
      ],
      onlySecond: [{ name: 'form-applicant', client: FORM_SERVICE, sources: [{ type: 'direct' }] }],
      sharedCount: 1,
      groups: { onlyFirst: ['/tenant-admins'], onlySecond: [] },
    });
  });

  it('treats roles with the same name on different clients as different', () => {
    const result = compareRoleAssignments(
      assignments([role('admin', FORM_SERVICE)]),
      assignments([role('admin', TENANT_SERVICE)]),
    );

    expect(result.sharedCount).toBe(0);
  });

  it('caps long differences and marks them truncated', () => {
    const many = Array.from({ length: MAX_COMPARED_ROLES + 1 }, (_, index) => role(`role-${index}`));

    const result = compareRoleAssignments(assignments(many), assignments([]));

    expect(result.onlyFirst).toHaveLength(MAX_COMPARED_ROLES);
    expect(result.truncated).toBe(true);
  });
});
