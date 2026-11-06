import { adspId, AuditService, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  auditDirectory,
  DirectoryAuditActions,
  EntryCreatedAuditAction,
  EntryDeletedAuditAction,
  toEntryAuditDetails,
  toTagAuditDetails,
} from './audit';

describe('audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'tester', name: 'Tester', roles: [], isCore: false, tenantId } as unknown as User;
  const logger = { warn: jest.fn() } as unknown as Logger;
  const auditService = { record: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defines deleted as warning severity with compliance retention', () => {
    expect(EntryDeletedAuditAction).toMatchObject({ severity: 'warning', retentionClass: 'compliance' });
    expect(DirectoryAuditActions.map((a) => a.name)).toEqual([
      'namespace.created',
      'tag.deleted',
      'resource.deleted',
      'entry.created',
      'entry.updated',
      'entry.deleted',
      'resource-tag.added',
      'resource-tag.removed',
    ]);
  });

  describe('details', () => {
    it('builds service and api entry urns', () => {
      expect(toEntryAuditDetails('ns', 'svc').resource).toEqual({ type: 'entry', id: 'urn:ads:ns:svc' });
      expect(toEntryAuditDetails('ns', 'svc', 'v1', { url: 'http://a' })).toMatchObject({
        resource: { type: 'entry', id: 'urn:ads:ns:svc:v1' },
        metadata: { namespace: 'ns', service: 'svc', api: 'v1', url: 'http://a' },
      });
    });

    it('builds tag details against the resource urn', () => {
      expect(toTagAuditDetails('urn:ads:platform:file-service:v1:/files/1', { value: 'a-tag' })).toEqual({
        resource: { type: 'resource', id: 'urn:ads:platform:file-service:v1:/files/1' },
        metadata: { tag: 'a-tag' },
      });
    });
  });

  describe('auditDirectory', () => {
    const details = toEntryAuditDetails('ns', 'svc');

    it('records with the actor and tenant', () => {
      auditService.record.mockResolvedValueOnce({ status: 'recorded' });
      auditDirectory(auditService as unknown as AuditService, logger, EntryCreatedAuditAction, user, tenantId, details);
      expect(auditService.record).toHaveBeenCalledWith(
        EntryCreatedAuditAction,
        expect.objectContaining({
          tenantId,
          actor: expect.objectContaining({ id: 'tester' }),
          resource: details.resource,
        }),
      );
    });

    it('logs a warning when the record is rejected', async () => {
      auditService.record.mockRejectedValueOnce(new Error('oh noes'));
      auditDirectory(auditService as unknown as AuditService, logger, EntryCreatedAuditAction, user, tenantId, details);
      await new Promise(process.nextTick);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('oh noes'), expect.anything());
    });

    it('does not log when auditing is disabled', async () => {
      auditService.record.mockResolvedValueOnce({
        status: 'rejected',
        eventId: 'event-1',
        code: 'audit_disabled',
        reason: 'disabled',
      });
      auditDirectory(auditService as unknown as AuditService, logger, EntryCreatedAuditAction, user, tenantId, details);
      await new Promise(process.nextTick);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('does not throw when recording throws synchronously', () => {
      auditService.record.mockImplementationOnce(() => {
        throw new Error('sync');
      });
      expect(() =>
        auditDirectory(
          auditService as unknown as AuditService,
          logger,
          EntryCreatedAuditAction,
          user,
          tenantId,
          details,
        ),
      ).not.toThrow();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
