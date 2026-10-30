import { AdspId } from '@abgov/adsp-service-sdk';
import { deleteThreadAndWorkspace, toTenantAdspId } from './threadDeletion';

const TENANT_ID = 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1';

describe('toTenantAdspId', () => {
  it('parses a tenant URN', () => {
    expect(toTenantAdspId(TENANT_ID).toString()).toBe(TENANT_ID);
  });

  it('builds the tenant URN from a bare tenant ID', () => {
    expect(toTenantAdspId('tenant-1').toString()).toBe(TENANT_ID);
  });
});

describe('deleteThreadAndWorkspace', () => {
  const logger = { warn: jest.fn() };
  const target = { tenantId: TENANT_ID, userId: 'user-1', threadId: 'thread-1' };

  function createProps() {
    const calls: string[] = [];
    return {
      calls,
      props: {
        logger: logger as never,
        clearWorkspace: jest.fn(async () => {
          calls.push('clearWorkspace');
        }),
        deleteThread: jest.fn(async () => {
          calls.push('deleteThread');
        }),
        eventService: {
          send: jest.fn(() => {
            calls.push('send');
          }),
        },
      },
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears the workspace, deletes the thread and then signals thread-deleted', async () => {
    const { calls, props } = createProps();

    await deleteThreadAndWorkspace(props as never, target);

    expect(calls).toEqual(['clearWorkspace', 'deleteThread', 'send']);
    expect(props.clearWorkspace).toHaveBeenCalledWith(TENANT_ID, 'user-1', 'thread-1');
    expect(props.deleteThread).toHaveBeenCalledWith('thread-1');
    expect(props.eventService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'thread-deleted',
        tenantId: expect.any(AdspId),
        payload: { threadId: 'thread-1' },
      }),
    );
  });

  it('does not delete the thread or signal when clearing the workspace fails', async () => {
    const { props } = createProps();
    props.clearWorkspace.mockRejectedValueOnce(new Error('workspace failed'));

    await expect(deleteThreadAndWorkspace(props as never, target)).rejects.toThrow('workspace failed');
    expect(props.deleteThread).not.toHaveBeenCalled();
    expect(props.eventService.send).not.toHaveBeenCalled();
  });

  it('does not signal when deleting the thread fails', async () => {
    const { props } = createProps();
    props.deleteThread.mockRejectedValueOnce(new Error('storage failed'));

    await expect(deleteThreadAndWorkspace(props as never, target)).rejects.toThrow('storage failed');
    expect(props.eventService.send).not.toHaveBeenCalled();
  });

  it('logs, rather than throws, when the event cannot be signalled', async () => {
    const { props } = createProps();
    props.eventService.send.mockImplementationOnce(() => {
      throw new Error('event failed');
    });

    await expect(deleteThreadAndWorkspace(props as never, target)).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to signal thread-deleted event for thread thread-1.',
      expect.objectContaining({ error: 'event failed' }),
    );
  });

  it('deletes the thread without an event service', async () => {
    const { props } = createProps();

    await deleteThreadAndWorkspace({ ...props, eventService: undefined } as never, target);

    expect(props.deleteThread).toHaveBeenCalledWith('thread-1');
  });
});
