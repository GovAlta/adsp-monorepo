import { adspId, auditDefinitions, User } from '@abgov/adsp-service-sdk';
import { toVerifyCodeAuditDetails, VerifyAuditActions } from './audit';

describe('audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  it('defines the verify service audit catalog', () => {
    const security = { version: 1, category: 'security', retentionClass: 'security', resourceType: 'verify-code' };
    expect(auditDefinitions(VerifyAuditActions)).toEqual({
      'code.generated': expect.objectContaining({ ...security, severity: 'info' }),
      'code.verified.succeeded': expect.objectContaining({ ...security, severity: 'info' }),
      'code.verified.failed': expect.objectContaining({ ...security, severity: 'warning' }),
      'code.attempts-exceeded-cleared': expect.objectContaining({ ...security, severity: 'warning' }),
    });
  });

  describe('toVerifyCodeAuditDetails', () => {
    it('builds details with the caller as actor and the key as resource', () => {
      const user = {
        id: 'service-account-id',
        name: 'service-account-urn:ads:platform:notification-service',
        roles: ['code-generator'],
      } as User;

      expect(toVerifyCodeAuditDetails(user, tenantId, 'test-key', { verified: true })).toEqual({
        tenantId,
        actor: {
          id: 'service-account-id',
          type: 'service',
          name: 'service-account-urn:ads:platform:notification-service',
          roles: ['code-generator'],
        },
        resource: { type: 'verify-code', id: 'test-key' },
        metadata: { codeKey: 'test-key', verified: true },
      });
    });
  });
});
