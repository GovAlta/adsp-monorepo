import { User, auditDefinitions } from '@abgov/adsp-service-sdk';
import { TenantAuditActions, toTenantAuditDetails } from './audit';

describe('tenant audit', () => {
  const tenant = {
    id: 'urn:ads:platform:tenant-service:v2:/tenants/test',
    name: 'Test',
    realm: 'test-realm',
  };

  const user = {
    id: 'user-1',
    name: 'Tester',
    email: 'tester@test.co',
    roles: ['tenant-service-admin'],
    isCore: true,
  } as User;

  describe('TenantAuditActions', () => {
    it('can define the tenant action catalog', () => {
      const catalog = auditDefinitions(TenantAuditActions);
      expect(catalog).toEqual({
        'tenant.created': expect.objectContaining({
          category: 'administrative',
          severity: 'info',
          retentionClass: 'compliance',
        }),
        'tenant.deleted': expect.objectContaining({
          category: 'administrative',
          severity: 'critical',
          retentionClass: 'compliance',
        }),
        'tenant.updated': expect.objectContaining({
          category: 'administrative',
          severity: 'info',
          retentionClass: 'compliance',
          captureChangeSet: true,
        }),
      });
    });
  });

  describe('toTenantAuditDetails', () => {
    it('can map the tenant and user to audit details', () => {
      const { tenantId, ...details } = toTenantAuditDetails(user, tenant);

      expect(tenantId.toString()).toBe(tenant.id);
      expect(details).toEqual({
        status: undefined,
        actor: {
          id: 'user-1',
          type: 'user',
          name: 'Tester',
          email: 'tester@test.co',
          roles: ['tenant-service-admin'],
        },
        resource: { type: 'tenant', id: tenant.id, name: tenant.name },
        correlationId: tenant.id,
        metadata: { tenantName: tenant.name, realm: tenant.realm },
        changeSet: undefined,
      });
    });

    it('can include status, metadata and change set', () => {
      const changeSet = { before: { name: 'Old' }, after: { name: 'Test' } };

      const details = toTenantAuditDetails(user, tenant, {
        status: 'failure',
        metadata: { error: 'Keycloak unavailable' },
        changeSet,
      });

      expect(details).toEqual(
        expect.objectContaining({
          status: 'failure',
          metadata: { error: 'Keycloak unavailable', tenantName: tenant.name, realm: tenant.realm },
          changeSet,
        }),
      );
    });

    it('can keep tenant name and realm over conflicting metadata', () => {
      const details = toTenantAuditDetails(user, tenant, { metadata: { tenantName: 'Other', realm: 'other' } });

      expect(details.metadata).toEqual({ tenantName: tenant.name, realm: tenant.realm });
    });

    it('can map a service account actor', () => {
      const details = toTenantAuditDetails({ ...user, name: 'service-account-urn:ads:platform:some-service' }, tenant);

      expect(details.actor).toEqual(expect.objectContaining({ type: 'service' }));
    });
  });
});
