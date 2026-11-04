import { adspId } from '@abgov/adsp-service-sdk';
import type { AuditRecordOutcome, AuditService } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import type { Logger } from 'winston';
import { createAccessAuditJob } from './job';
import { LoginFailureLimiter } from './limiter';

describe('createAccessAuditJob', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/6f0d3c1a2b4e5f6a7b8c9d0e`;
  const logger = { warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const record = jest.fn<Promise<AuditRecordOutcome>, Parameters<AuditService['record']>>();
  const auditService = { record } as unknown as AuditService;

  const userDeleted: DomainEvent = {
    namespace: 'access-service',
    name: 'DELETE-USER',
    tenantId,
    timestamp: new Date(),
    payload: {
      realmId: 'test-tenant-realm',
      operationType: 'DELETE',
      resourceType: 'USER',
      resourcePath: 'users/9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d',
      representation: null,
      authDetails: { userId: '1d2c3b4a-5e6f-4a7b-8c9d-0e1f2a3b4c5d', realmName: 'core' },
    },
  };
  const loginFailed: DomainEvent = {
    namespace: 'access-service',
    name: 'LOGIN_ERROR',
    tenantId,
    timestamp: new Date(),
    payload: {
      id: '3e2d1c0b-9a8f-4e7d-8c6b-5a4f3e2d1c0b',
      type: 'LOGIN_ERROR',
      error: 'invalid_user_credentials',
      realmId: 'test-tenant-realm',
      details: { username: 'jordan.tester' },
    },
  };
  const login: DomainEvent = { ...loginFailed, name: 'LOGIN', payload: { ...loginFailed.payload, error: null } };

  const createJob = (loginFailuresPerMinute = 60) =>
    createAccessAuditJob({ logger, auditService, limiter: new LoginFailureLimiter(logger, loginFailuresPerMinute) });

  beforeEach(() => {
    record.mockReset();
    record.mockResolvedValue({ status: 'recorded', eventId: 'event-id' });
  });

  it('records an audited access event in the tenant of the event', async () => {
    const done = jest.fn();

    await createJob()(userDeleted, done);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'access.user.deleted', severity: 'critical' }),
      expect.objectContaining({ tenantId }),
    );
  });

  it('acknowledges the event once it is recorded', async () => {
    const done = jest.fn();

    await createJob()(userDeleted, done);

    expect(done).toHaveBeenCalledWith();
  });

  it('acknowledges an event the audit service rejects', async () => {
    record.mockResolvedValue({ status: 'rejected', eventId: 'event-id', code: 'invalid_event', reason: 'Invalid.' });
    const done = jest.fn();

    await createJob()(userDeleted, done);

    expect(done).toHaveBeenCalledWith();
  });

  it('acknowledges the event when audit recording is disabled so the queue does not back up', async () => {
    record.mockResolvedValue({ status: 'disabled', eventId: 'event-id' });
    const done = jest.fn();

    await createJob()(userDeleted, done);

    expect(done).toHaveBeenCalledWith();
  });

  it('fails the event when the record is not delivered so it is retried', async () => {
    record.mockResolvedValue({ status: 'failed', eventId: 'event-id', reason: 'retries_exhausted', error: 'Timeout.' });
    const done = jest.fn();

    await createJob()(userDeleted, done);

    expect(done).toHaveBeenCalledWith(expect.any(Error));
  });

  it('fails the event instead of throwing when recording throws unexpectedly', async () => {
    record.mockRejectedValue(new Error('Unexpected.'));
    const done = jest.fn();

    await createJob()(userDeleted, done);

    expect(done).toHaveBeenCalledWith(expect.any(Error));
  });

  it('does not record an access event that is not audited', async () => {
    const done = jest.fn();

    await createJob()(login, done);

    expect(record).not.toHaveBeenCalled();
  });

  it('acknowledges an access event that is not audited', async () => {
    const done = jest.fn();

    await createJob()(login, done);

    expect(done).toHaveBeenCalledWith();
  });

  it('does not record login failures over the limit', async () => {
    const job = createJob(1);

    await job(loginFailed, jest.fn());
    await job(loginFailed, jest.fn());

    expect(record).toHaveBeenCalledTimes(1);
  });

  it('acknowledges login failures over the limit', async () => {
    const job = createJob(1);
    await job(loginFailed, jest.fn());
    const done = jest.fn();

    await job(loginFailed, done);

    expect(done).toHaveBeenCalledWith();
  });

  it('does not limit admin events', async () => {
    const job = createJob(0);

    await job(userDeleted, jest.fn());

    expect(record).toHaveBeenCalledTimes(1);
  });
});
