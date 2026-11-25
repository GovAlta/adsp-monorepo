import { adspId, AuditService, resolveRetentionClass, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  AuditRecorder,
  createAuditRecorder,
  CredentialDeletedAuditAction,
  CredentialSetAuditAction,
  DataPushedAuditAction,
  DestinationSetUpAuditAction,
  DestinationTestedAuditAction,
  DestinationVerifiedAuditAction,
  FilePushedAuditAction,
  SharePointAuditActions,
} from './audit';

describe('SharePoint audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'admin', name: 'Admin', tenantId, roles: ['sharepoint-admin'], isCore: false } as unknown as User;
  const req = { user, tenant: { id: tenantId } };
  const resource = { type: 'sharepoint-connection', id: 'hr-site' };

  let auditService: { record: jest.Mock };
  let logger: { warn: jest.Mock };

  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    auditService = { record: jest.fn().mockResolvedValue({ status: 'recorded', eventId: 'event-1' }) };
    logger = { warn: jest.fn() };
  });

  const record = (request: unknown = req) =>
    createAuditRecorder(auditService as unknown as AuditService, logger as unknown as Logger)(
      request as Parameters<AuditRecorder>[0],
      CredentialSetAuditAction,
      { resource, metadata: { connectionId: 'hr-site' } },
    );

  it('defines the secret change, data push and destination admin actions', () => {
    expect(
      SharePointAuditActions.map((action) => [
        action.name,
        action.category,
        action.severity,
        resolveRetentionClass(action),
        action.resourceType,
      ]),
    ).toEqual([
      ['credential.set', 'security', 'info', 'security', 'sharepoint-connection'],
      ['credential.deleted', 'security', 'warning', 'security', 'sharepoint-connection'],
      ['data.pushed', 'data-access', 'info', 'compliance', 'sharepoint-destination'],
      ['file.pushed', 'data-access', 'info', 'compliance', 'sharepoint-destination'],
      ['destination.tested', 'administrative', 'info', 'compliance', 'sharepoint-destination'],
      ['destination.verified', 'administrative', 'info', 'compliance', 'sharepoint-destination'],
      ['destination.set-up', 'administrative', 'info', 'compliance', 'sharepoint-destination'],
    ]);
    expect([
      CredentialSetAuditAction,
      CredentialDeletedAuditAction,
      DataPushedAuditAction,
      FilePushedAuditAction,
      DestinationTestedAuditAction,
      DestinationVerifiedAuditAction,
      DestinationSetUpAuditAction,
    ]).toEqual(SharePointAuditActions);
  });

  it('records against the request tenant with the signed-in user as the actor', () => {
    record();

    expect(auditService.record).toHaveBeenCalledWith(CredentialSetAuditAction, {
      tenantId,
      actor: expect.objectContaining({ id: 'admin', type: 'user', name: 'Admin' }),
      resource,
      metadata: { connectionId: 'hr-site' },
    });
  });

  it('records a service account as a service actor', () => {
    const serviceAccount = { ...user, id: 'form-service', name: 'service-account-urn:ads:platform:form-service' };

    record({ user: serviceAccount, tenant: { id: tenantId } });

    expect(auditService.record.mock.calls[0][1].actor).toEqual(
      expect.objectContaining({ id: 'form-service', type: 'service' }),
    );
  });

  it('logs the code of a rejected entry, without its details', async () => {
    auditService.record.mockResolvedValueOnce({
      status: 'rejected',
      eventId: 'event-1',
      code: 'invalid_metadata',
      reason: 'metadata.connectionId must be hr-site',
    });

    record();
    await flushPromises();

    expect(logger.warn).toHaveBeenCalledWith(
      "Audit entry credential.set for sharepoint-connection 'hr-site' was not recorded (invalid_metadata).",
      { context: 'SharePointAudit', tenant: tenantId.toString() },
    );
  });

  it('logs the reason of an entry that could not be delivered, without the error', async () => {
    auditService.record.mockResolvedValueOnce({
      status: 'failed',
      eventId: 'event-1',
      reason: 'retries_exhausted',
      error: 'request failed for hr-site',
    });

    record();
    await flushPromises();

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('(retries_exhausted)'), expect.anything());
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain('request failed');
  });

  it('does not log when recording is turned off', async () => {
    auditService.record.mockResolvedValueOnce({
      status: 'rejected',
      eventId: 'event-1',
      code: 'audit_disabled',
      reason: 'disabled',
    });

    record();
    await flushPromises();

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a failed record call without its error message', async () => {
    auditService.record.mockRejectedValueOnce(new Error('connect ECONNREFUSED with hr-site secret'));

    record();
    await flushPromises();

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('(Error)'), expect.anything());
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain('ECONNREFUSED');
  });

  it('never throws, even without a user to attribute the entry to', () => {
    expect(() => record({ tenant: { id: tenantId } })).not.toThrow();
    expect(auditService.record).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('was not recorded (Error)'), expect.anything());
  });
});
