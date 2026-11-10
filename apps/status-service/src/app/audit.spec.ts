import { adspId, AuditService, resolveRetentionClass, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  ApplicationStatusChangedAuditAction,
  auditStatus,
  StatusAuditActions,
  toApplicationAuditDetails,
  toNoticeAuditDetails,
} from './audit';

describe('status audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'user-1', name: 'tester', tenantId, roles: ['status-admin'] } as unknown as User;
  const logger = { warn: jest.fn() } as unknown as Logger;
  const auditService = { record: jest.fn(), flush: jest.fn() } as unknown as AuditService & { record: jest.Mock };

  beforeEach(() => jest.clearAllMocks());

  it('derives compliance retention from the category, except notices and health checks which keep standard', () => {
    expect(Object.fromEntries(StatusAuditActions.map((a) => [a.name, resolveRetentionClass(a)]))).toEqual({
      'application.created': 'compliance',
      'application.updated': 'compliance',
      'application.deleted': 'compliance',
      'application.status-changed': 'compliance',
      'notice.created': 'standard',
      'notice.updated': 'standard',
      'notice.deleted': 'standard',
      'health-check.configured': 'standard',
    });
  });

  it('registers eight uniquely named actions', () => {
    expect(StatusAuditActions).toHaveLength(8);
    expect(new Set(StatusAuditActions.map((a) => a.name)).size).toBe(8);
  });

  it('captures change set only for status changes', () => {
    expect(StatusAuditActions.filter((a) => a.captureChangeSet)).toEqual([ApplicationStatusChangedAuditAction]);
  });

  it('builds application details', () => {
    const details = toApplicationAuditDetails('app-1', 'App', { url: 'http://a' }, { after: { status: 'x' } });
    expect(details).toEqual({
      resource: { type: 'application', id: 'app-1' },
      metadata: { url: 'http://a', appKey: 'app-1', name: 'App' },
      changeSet: { after: { status: 'x' } },
    });
  });

  it('builds notice details with ISO dates', () => {
    const details = toNoticeAuditDetails({ id: 'n1', message: 'm', startDate: '2022-04-07T16:00:00.000Z', mode: 'active' });
    expect(details.resource).toEqual({ type: 'notice', id: 'n1' });
    expect(details.metadata).toEqual(
      expect.objectContaining({ message: 'm', startDate: '2022-04-07T16:00:00.000Z', endDate: undefined }),
    );
  });

  it('records the user id, type, name and roles as the actor, without the email', () => {
    auditService.record.mockResolvedValue({ status: 'recorded' });
    const withEmail = { ...user, email: 'tester@example.com' } as unknown as User;
    auditStatus(auditService, logger, ApplicationStatusChangedAuditAction, withEmail, toApplicationAuditDetails('a', 'A'));
    expect(auditService.record).toHaveBeenCalledWith(
      ApplicationStatusChangedAuditAction,
      expect.objectContaining({
        actor: { id: 'user-1', type: 'user', name: 'tester', roles: ['status-admin'] },
        correlationId: 'a',
      }),
    );
  });

  it('skips users without a tenant', () => {
    auditStatus(auditService, logger, ApplicationStatusChangedAuditAction, { ...user, tenantId: undefined } as User, toApplicationAuditDetails('a', 'A'));
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('swallows rejection and logs a warning', async () => {
    auditService.record.mockRejectedValue(new Error('boom'));
    expect(() =>
      auditStatus(auditService, logger, ApplicationStatusChangedAuditAction, user, toApplicationAuditDetails('a', 'A')),
    ).not.toThrow();
    await new Promise(process.nextTick);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('boom'), expect.anything());
  });

  it('swallows synchronous throws', () => {
    auditService.record.mockImplementation(() => {
      throw new Error('sync');
    });
    expect(() =>
      auditStatus(auditService, logger, ApplicationStatusChangedAuditAction, user, toApplicationAuditDetails('a', 'A')),
    ).not.toThrow();
    expect(logger.warn).toHaveBeenCalled();
  });
});
