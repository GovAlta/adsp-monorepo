import { adspId, auditDefinitions, User } from '@abgov/adsp-service-sdk';
import {
  AnonymousAuditActor,
  FileAuditActions,
  FileServiceJobAuditActor,
  toFileAuditActor,
  toFileAuditDetails,
} from './audit';
import { jobUser } from './job/user';
import { FileEntity } from './model';

describe('file audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  it('registers a valid catalog of the file actions', () => {
    const definitions = auditDefinitions(FileAuditActions);

    expect(definitions).toEqual({
      'file.uploaded': expect.objectContaining({
        category: 'data-access',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'file',
      }),
      'file.downloaded': expect.objectContaining({
        category: 'data-access',
        severity: 'info',
        retentionClass: 'compliance',
      }),
      'file.unsafe-downloaded': expect.objectContaining({
        category: 'data-access',
        severity: 'warning',
        retentionClass: 'security',
      }),
      'file.deleted': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        retentionClass: 'compliance',
      }),
      'file.scan-completed': expect.objectContaining({
        category: 'runtime',
        severity: 'info',
        retentionClass: 'standard',
      }),
      'file.scan-threat-found': expect.objectContaining({
        category: 'security',
        severity: 'critical',
        retentionClass: 'security',
      }),
    });
  });

  describe('toFileAuditActor', () => {
    it('can convert user', () => {
      const user = { id: 'tester', name: 'Tester', roles: ['a'] } as User;
      expect(toFileAuditActor(user)).toEqual(expect.objectContaining({ id: 'tester', type: 'user' }));
    });

    it('can convert service account', () => {
      const user = { id: 'svc', name: 'service-account-form-service', roles: [] } as User;
      expect(toFileAuditActor(user)).toEqual(expect.objectContaining({ id: 'svc', type: 'service' }));
    });

    it('returns anonymous actor for no user', () => {
      expect(toFileAuditActor(undefined)).toBe(AnonymousAuditActor);
    });
  });

  it('identifies the job actor as the job user', () => {
    expect(FileServiceJobAuditActor).toMatchObject({ id: jobUser.id, type: 'system' });
  });

  describe('toFileAuditDetails', () => {
    it('can build details', () => {
      const file = {
        tenantId,
        id: 'file-1',
        filename: 'test.pdf',
        typeId: 'type-1',
        recordId: 'record-1',
        size: 10,
      } as FileEntity;

      expect(toFileAuditDetails(AnonymousAuditActor, file, { extra: true })).toEqual({
        tenantId,
        actor: AnonymousAuditActor,
        resource: { type: 'file', id: 'file-1', name: 'test.pdf' },
        correlationId: 'record-1',
        metadata: { filename: 'test.pdf', type: 'type-1', recordId: 'record-1', size: 10, extra: true },
      });
    });
  });
});
