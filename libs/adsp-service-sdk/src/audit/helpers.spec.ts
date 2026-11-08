import type { User } from '../access';
import { adspId } from '../utils';
import { auditDetailsFromRequest, toAuditActor } from './helpers';

describe('audit helpers', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const userTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/user`;
  const targetTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/target`;

  function makeUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-1',
      name: 'Jane Tester',
      email: 'jane@example.test',
      roles: ['case-admin'],
      tenantId: userTenantId,
      isCore: false,
      token: null,
      ...overrides,
    } as User;
  }

  describe('toAuditActor', () => {
    it('maps a user to a user actor', () => {
      expect(toAuditActor(makeUser())).toEqual({
        id: 'user-1',
        type: 'user',
        name: 'Jane Tester',
        email: 'jane@example.test',
        roles: ['case-admin'],
      });
    });

    it('maps a Keycloak service account to a service actor', () => {
      const actor = toAuditActor(makeUser({ name: 'service-account-case-service', email: undefined }));

      expect(actor).toMatchObject({ type: 'service', name: 'service-account-case-service' });
    });

    it('omits an empty name and email', () => {
      const actor = toAuditActor(makeUser({ name: '', email: '' }));

      expect(actor).toMatchObject({ type: 'user', name: undefined, email: undefined });
    });

    it('throws when there is no user', () => {
      expect(() => toAuditActor(undefined)).toThrow('Cannot create an audit actor without a user.');
    });
  });

  describe('auditDetailsFromRequest', () => {
    it('defaults the actor to the request user and the tenant to the request tenant', () => {
      const details = auditDetailsFromRequest(
        { user: makeUser(), tenant: { id: tenantId } },
        { resource: { type: 'case', id: 'c-1' }, metadata: { reason: 'review' } },
      );

      expect(details).toEqual({
        actor: toAuditActor(makeUser()),
        tenantId,
        resource: { type: 'case', id: 'c-1' },
        metadata: { reason: 'review' },
      });
    });

    it("falls back to the user's tenant when the request has no tenant", () => {
      const details = auditDetailsFromRequest({ user: makeUser() });

      expect(details.tenantId).toBe(userTenantId);
    });

    it('leaves the tenant undefined when neither the request nor the user has one', () => {
      const details = auditDetailsFromRequest({ user: makeUser({ tenantId: undefined, isCore: true }) });

      expect(details.tenantId).toBeUndefined();
    });

    it('uses an explicit tenant and actor over the request context', () => {
      const actor = { id: 'job-1', type: 'system' as const };

      const details = auditDetailsFromRequest(
        { user: makeUser(), tenant: { id: tenantId } },
        { actor, tenantId: targetTenantId, status: 'failure' },
      );

      expect(details).toEqual({ actor, tenantId: targetTenantId, status: 'failure' });
    });

    it('does not require a request user when the actor is explicit', () => {
      const actor = { id: 'job-1', type: 'system' as const };

      expect(auditDetailsFromRequest({ tenant: { id: tenantId } }, { actor })).toEqual({ actor, tenantId });
    });

    it('throws when the request has no user and no actor is provided', () => {
      expect(() => auditDetailsFromRequest({ tenant: { id: tenantId } }, {})).toThrow(
        'Cannot create an audit actor without a user.',
      );
    });
  });
});
