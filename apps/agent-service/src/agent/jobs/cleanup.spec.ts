import { createThreadCleanupJob } from './cleanup';

const TENANT_ID = 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1';

describe('createThreadCleanupJob', () => {
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const tenantId = { toString: () => TENANT_ID };

  function thread(id: string, expiresAt: unknown, overrides: Record<string, unknown> = {}) {
    return { id, resourceId: 'user-1', metadata: { expiresAt, tenantId: TENANT_ID }, ...overrides };
  }

  function createJob(threads: unknown[]) {
    const memory = {
      listThreads: jest.fn().mockResolvedValue({ threads, hasMore: false }),
      deleteThread: jest.fn().mockResolvedValue(undefined),
    };
    const clearWorkspace = jest.fn().mockResolvedValue(undefined);
    const eventService = { send: jest.fn() };
    const job = createThreadCleanupJob({
      logger: logger as never,
      tenantId: tenantId as never,
      memory: memory as never,
      clearWorkspace,
      eventService: eventService as never,
    });
    return { job, memory, clearWorkspace, eventService };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes expired threads with their workspace and signals thread-deleted', async () => {
    const { job, memory, clearWorkspace, eventService } = createJob([thread('expired', Date.now() - 1000)]);

    await job();

    expect(clearWorkspace).toHaveBeenCalledWith(TENANT_ID, 'user-1', 'expired');
    expect(memory.deleteThread).toHaveBeenCalledWith('expired');
    expect(eventService.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'thread-deleted' }));
    expect(logger.info).toHaveBeenCalledWith(
      'Completed thread cleanup job. Expired: 1, cleaned: 1, failed: 0.',
      expect.anything(),
    );
  });

  it('keeps threads that have not expired or have no expiry', async () => {
    const { job, memory } = createJob([thread('active', Date.now() + 60000), thread('no-expiry', undefined)]);

    await job();

    expect(memory.deleteThread).not.toHaveBeenCalled();
  });

  it('counts an expired thread without a user as failed', async () => {
    const { job, memory } = createJob([thread('orphan', Date.now() - 1000, { resourceId: '' })]);

    await job();

    expect(memory.deleteThread).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      'Completed thread cleanup job. Expired: 1, cleaned: 0, failed: 1.',
      expect.anything(),
    );
  });

  it('counts a failed deletion and continues with the next thread', async () => {
    const { job, memory } = createJob([thread('first', Date.now() - 1000), thread('second', Date.now() - 1000)]);
    memory.deleteThread.mockRejectedValueOnce(new Error('storage failed'));

    await job();

    expect(memory.deleteThread).toHaveBeenCalledWith('second');
    expect(logger.warn).toHaveBeenCalledWith('Failed cleanup for expired thread first.', expect.anything());
    expect(logger.info).toHaveBeenCalledWith(
      'Completed thread cleanup job. Expired: 2, cleaned: 1, failed: 1.',
      expect.anything(),
    );
  });
});
