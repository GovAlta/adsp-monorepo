import { adspId, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { FailedAuditEvent, FailedEventReplayTransaction, FailedEventRepository } from '../types';
import { FailedEventService } from './failed-events';
import { enrichEvent } from '../utils/event-preparation';
import { REPLAY_DEFINITION } from '../actions';
import { DEFAULT_RETENTION_CLASSES } from './retention';
import { encodeKeysetCursor } from '../utils/keyset-cursor';

describe('FailedEventService', () => {
  const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/case-team';
  const writtenBy = 'urn:ads:platform:audit-service';
  const id = '54862935-e55b-4bc4-8cd0-9e64b193bbd2';
  const replayedAs = 'bf50d84d-bb5e-4e70-8a40-d2ee1c6d31ac';
  const administrator: User = {
    id: 'audit-administrator',
    name: 'Audit administrator',
    email: 'admin@example.test',
    tenantId: adspId`${tenantId}`,
    isCore: false,
    roles: ['audit-admin'],
    token: { azp: 'admin-app', aud: writtenBy, iss: 'tenant-issuer', bearer: 'test', email_verified: true },
  };
  const failed: FailedAuditEvent = {
    id,
    tenant_id: tenantId,
    namespace: 'case-service',
    event_id: '735e3267-4d41-4387-8670-6ccdc551965a',
    event: { actor: { id: 'original-case-worker', type: 'user' }, occurredAt: '2020-01-01T00:00:00Z' },
    error: 'Storage unavailable',
    attempts: 3,
    failed_at: new Date('2026-10-01T00:00:00Z'),
    status: 'open',
    replayed_as: null,
  };
  const transaction: jest.Mocked<FailedEventReplayTransaction> = {
    getForUpdate: jest.fn(),
    insertReplayedEvent: jest.fn(),
    markReplayed: jest.fn(),
    insertReplayAudit: jest.fn(),
  };
  const repository: jest.Mocked<FailedEventRepository> = {
    list: jest.fn(),
    countOpen: jest.fn(),
    withReplayTransaction: jest.fn(),
  };
  const metrics = { recordParkedEvent: jest.fn(), recordWriteFailure: jest.fn() };
  const preparer = { prepare: jest.fn(), prepareAudit: jest.fn() };
  const prepared = enrichEvent(
    {
      eventId: failed.event_id,
      occurredAt: '2020-01-01T00:00:00Z',
      action: 'case.update',
      status: 'success',
      actor: { id: 'original-case-worker', type: 'user' },
    },
    REPLAY_DEFINITION,
    { tenantId, namespace: failed.namespace, writtenBy, receivedAt: new Date() },
    DEFAULT_RETENTION_CLASSES,
  );
  const service = new FailedEventService(repository, writtenBy, metrics, preparer);

  beforeEach(() => {
    jest.resetAllMocks();
    repository.list.mockResolvedValue([failed]);
    repository.withReplayTransaction.mockImplementation(async (_tenantId, work) => work(transaction));
    transaction.getForUpdate.mockResolvedValue(failed);
    transaction.insertReplayedEvent.mockResolvedValue(replayedAs);
    preparer.prepare.mockResolvedValue(prepared);
    preparer.prepareAudit.mockResolvedValue({ ...prepared, namespace: 'audit-service' });
  });

  it('passes a decoded cursor and tenant to the repository', async () => {
    const after = encodeKeysetCursor(failed.failed_at, id);
    await service.list(tenantId, 1, after);

    expect(repository.list).toHaveBeenCalledWith(tenantId, 1, { failedAt: failed.failed_at, id });
  });

  it('rejects a malformed cursor', async () => {
    await expect(service.list(tenantId, 1, 'MjA=')).rejects.toThrow(InvalidOperationError);
  });

  it('returns the shared Results pagination shape with a keyset next cursor', async () => {
    const after = encodeKeysetCursor(failed.failed_at, id);
    const result = await service.list(tenantId, 1, after);

    expect(result).toEqual({
      results: [failed],
      page: { after, size: 1, next: encodeKeysetCursor(failed.failed_at, failed.id) },
    });
  });

  it('omits a next cursor on a short page', async () => {
    const result = await service.list(tenantId, 20);

    expect(result.page.next).toBeUndefined();
  });

  it('returns an empty page when the tenant has no failed events', async () => {
    repository.list.mockResolvedValue([]);

    const result = await service.list(tenantId, 20);

    expect(result).toEqual({ results: [], page: { after: undefined, size: 0, next: undefined } });
  });

  it('does not expose an incorrectly scoped repository result', async () => {
    repository.list.mockResolvedValue([{ ...failed, tenant_id: 'another-tenant' }]);

    await expect(service.list(tenantId, 20)).rejects.toThrow(InvalidOperationError);
  });

  it('rejects an oversized repository page', async () => {
    repository.list.mockResolvedValue([failed, failed]);

    await expect(service.list(tenantId, 1)).rejects.toThrow(InvalidOperationError);
  });

  it('passes original input and the Audit Service writer to storage, including old events', async () => {
    await service.replay(tenantId, id, administrator);

    expect(preparer.prepare).toHaveBeenCalledWith(failed, writtenBy);
    expect(transaction.insertReplayedEvent).toHaveBeenCalledWith(prepared);
  });

  it('starts the transaction in the caller tenant', async () => {
    await service.replay(tenantId, id, administrator);

    expect(repository.withReplayTransaction).toHaveBeenCalledWith(tenantId, expect.any(Function));
  });

  it('links the failed event to its stored row ID rather than event_id', async () => {
    await service.replay(tenantId, id, administrator);

    expect(transaction.markReplayed).toHaveBeenCalledWith(id, replayedAs);
  });

  it('records the administrator separately from the original actor', async () => {
    await service.replay(tenantId, id, administrator);

    expect(preparer.prepareAudit).toHaveBeenCalledWith(
      {
        namespace: 'audit-service',
        writtenBy,
        event: {
          eventId: expect.any(String),
          occurredAt: expect.any(String),
          action: 'failed-event.replay.succeeded',
          status: 'success',
          actor: { id: administrator.id, type: 'user', roles: ['audit-admin'] },
          resource: { type: 'failed-event', id },
          metadata: { replayedAs },
        },
      },
      tenantId,
    );
    expect(transaction.insertReplayAudit).toHaveBeenCalledWith({ ...prepared, namespace: 'audit-service' });
  });

  it('returns a replayed record without mutating the locked input', async () => {
    const result = await service.replay(tenantId, id, administrator);

    expect({ result, originalStatus: failed.status }).toEqual({
      result: { ...failed, status: 'replayed', replayed_as: replayedAs },
      originalStatus: 'open',
    });
  });

  it.each(['replayed', 'discarded'] as const)('refuses a %s event without writing', async (status) => {
    transaction.getForUpdate.mockResolvedValue({ ...failed, status });

    await expect(service.replay(tenantId, id, administrator)).rejects.toMatchObject({ extra: { statusCode: 409 } });

    expect(transaction.insertReplayedEvent).not.toHaveBeenCalled();
    expect(metrics.recordWriteFailure).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown row', async () => {
    transaction.getForUpdate.mockResolvedValue(null);

    await expect(service.replay(tenantId, id, administrator)).rejects.toThrow(NotFoundError);
  });

  it('does not replay a row from another tenant', async () => {
    transaction.getForUpdate.mockResolvedValue({ ...failed, tenant_id: 'another-tenant' });

    await expect(service.replay(tenantId, id, administrator)).rejects.toThrow(NotFoundError);

    expect(transaction.insertReplayedEvent).not.toHaveBeenCalled();
  });

  it('propagates failed storage to the transaction without marking the row replayed', async () => {
    transaction.insertReplayedEvent.mockRejectedValue(new Error('Insert failed'));

    await expect(service.replay(tenantId, id, administrator)).rejects.toThrow('Insert failed');

    expect(transaction.markReplayed).not.toHaveBeenCalled();
  });

  it('refuses an empty stored row ID', async () => {
    transaction.insertReplayedEvent.mockResolvedValue('');

    await expect(service.replay(tenantId, id, administrator)).rejects.toThrow('row ID');

    expect(transaction.markReplayed).not.toHaveBeenCalled();
  });

  it('propagates linkage failure so the transaction can roll back the inserted event', async () => {
    transaction.markReplayed.mockRejectedValue(new Error('Link failed'));

    await expect(service.replay(tenantId, id, administrator)).rejects.toThrow('Link failed');
  });

  it('propagates self-audit failure so the transaction can roll back all changes', async () => {
    transaction.insertReplayAudit.mockRejectedValue(new Error('Self-audit failed'));

    await expect(service.replay(tenantId, id, administrator)).rejects.toThrow('Self-audit failed');

    expect(metrics.recordWriteFailure).toHaveBeenCalledWith('replay');
  });

  it('does not report success before the repository commits', async () => {
    repository.withReplayTransaction.mockImplementation(async (_tenantId, work) => {
      await work(transaction);
      throw new Error('Commit failed');
    });

    await expect(service.replay(tenantId, id, administrator)).rejects.toThrow('Commit failed');

    expect(metrics.recordWriteFailure).toHaveBeenCalledTimes(1);
  });

  it('fails closed when listing without a repository', async () => {
    const unavailable = new FailedEventService(undefined, writtenBy, metrics, preparer);

    await expect(unavailable.list(tenantId, 20)).rejects.toMatchObject({ extra: { statusCode: 503 } });
  });

  it('fails closed when replaying without a repository', async () => {
    const unavailable = new FailedEventService(undefined, writtenBy, metrics, preparer);

    await expect(unavailable.replay(tenantId, id, administrator)).rejects.toMatchObject({ extra: { statusCode: 503 } });
  });
});
