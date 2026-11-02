import { AuditService, User, auditDefinitions } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  TenantAuditActions,
  TenantCreatedAuditAction,
  TenantDeletedAuditAction,
  TenantUpdatedAuditAction,
  createTenantAuditor,
  toAuditActor,
} from './audit';

describe('tenant audit', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const auditServiceMock = {
    record: jest.fn(),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  describe('toAuditActor', () => {
    it('can map a user', () => {
      expect(toAuditActor(user)).toEqual({
        id: 'user-1',
        type: 'user',
        name: 'Tester',
        email: 'tester@test.co',
        roles: ['tenant-service-admin'],
      });
    });

    it('can map a service account', () => {
      const actor = toAuditActor({ ...user, name: 'service-account-urn:ads:platform:some-service', email: '' });
      expect(actor).toEqual(expect.objectContaining({ type: 'service', email: undefined }));
    });

    it('can map a missing user to the system', () => {
      expect(toAuditActor(undefined)).toEqual({ id: 'tenant-service', type: 'system' });
    });
  });

  describe('createTenantAuditor', () => {
    it('can record an event for the tenant', async () => {
      auditServiceMock.record.mockResolvedValueOnce({ status: 'recorded', eventId: 'event-1' });
      const auditor = createTenantAuditor(loggerMock, auditServiceMock as AuditService);

      await auditor.record(TenantCreatedAuditAction, user, tenant, {
        operation: 'create',
        metadata: { realmProvisioning: 'new' },
      });

      const [action, { tenantId, ...details }] = auditServiceMock.record.mock.calls[0];
      expect(action).toBe(TenantCreatedAuditAction);
      expect(tenantId.toString()).toBe(tenant.id);
      expect(details).toEqual({
        status: undefined,
        actor: toAuditActor(user),
        resource: { type: 'tenant', id: tenant.id, name: tenant.name },
        correlationId: tenant.id,
        metadata: { realmProvisioning: 'new', tenantName: tenant.name, realm: tenant.realm, operation: 'create' },
        changeSet: undefined,
      });
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });

    it('can pass status and change set', async () => {
      auditServiceMock.record.mockResolvedValueOnce({ status: 'recorded', eventId: 'event-1' });
      const auditor = createTenantAuditor(loggerMock, auditServiceMock as AuditService);
      const changeSet = { before: { name: 'Old' }, after: { name: 'Test' } };

      await auditor.record(TenantUpdatedAuditAction, user, tenant, {
        operation: 'update-name',
        status: 'failure',
        changeSet,
      });

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        TenantUpdatedAuditAction,
        expect.objectContaining({ status: 'failure', changeSet }),
      );
    });

    it('can log warning for rejected event', async () => {
      auditServiceMock.record.mockResolvedValueOnce({
        status: 'rejected',
        eventId: 'event-1',
        code: 'unknown_action',
        reason: 'Action is not registered.',
      });
      const auditor = createTenantAuditor(loggerMock, auditServiceMock as AuditService);

      await expect(
        auditor.record(TenantDeletedAuditAction, user, tenant, { operation: 'delete' }),
      ).resolves.toBeUndefined();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('tenant.deleted'),
        expect.objectContaining({ context: 'TenantAudit' }),
      );
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('unknown_action'), expect.anything());
    });

    it('can log warning for failed event', async () => {
      auditServiceMock.record.mockResolvedValueOnce({
        status: 'failed',
        eventId: 'event-1',
        reason: 'retries_exhausted',
        error: 'Request failed with status 503.',
      });
      const auditor = createTenantAuditor(loggerMock, auditServiceMock as AuditService);

      await expect(
        auditor.record(TenantDeletedAuditAction, user, tenant, { operation: 'delete' }),
      ).resolves.toBeUndefined();
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('status 503'), expect.anything());
    });

    it('can log warning instead of rejecting on unexpected error', async () => {
      auditServiceMock.record.mockRejectedValueOnce(new Error('Unexpected'));
      const auditor = createTenantAuditor(loggerMock, auditServiceMock as AuditService);

      await expect(
        auditor.record(TenantDeletedAuditAction, user, tenant, { operation: 'delete' }),
      ).resolves.toBeUndefined();
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('Unexpected'), expect.anything());
    });

    it('can log warning instead of rejecting on invalid tenant id', async () => {
      const auditor = createTenantAuditor(loggerMock, auditServiceMock as AuditService);

      await expect(
        auditor.record(TenantDeletedAuditAction, user, { ...tenant, id: 'not-a-urn' }, { operation: 'delete' }),
      ).resolves.toBeUndefined();
      expect(auditServiceMock.record).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });
});
