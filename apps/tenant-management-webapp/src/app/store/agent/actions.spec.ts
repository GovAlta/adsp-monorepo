import axios from 'axios';
import { CLEAR_THREAD_ACTION, connectAgent, discardThread, getAccessScope, messageAgent } from './actions';

jest.mock('axios');
jest.mock('@store/tenant/actions', () => ({
  getAccessToken: () => async () => 'user-token',
}));

const mockSocket = {
  connected: false,
  handlers: {} as Record<string, (...args: unknown[]) => void>,
  on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
    mockSocket.handlers[event] = handler;
  }),
  send: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};
jest.mock('socket.io-client', () => ({ io: jest.fn(() => mockSocket) }));

const mockedGet = axios.get as jest.Mock;
const mockedDelete = axios.delete as jest.Mock;

function createDispatch(state: unknown) {
  const getState = () => state;
  const dispatch = jest.fn((action) => (typeof action === 'function' ? action(dispatch, getState) : action));
  return { dispatch, getState };
}

describe('getAccessScope', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("requests the scope from agent-service with the user's token", async () => {
    const scope = { status: 'available', message: 'You can inspect the realm-1 realm in Development (read-only).' };
    mockedGet.mockResolvedValueOnce({ data: scope });
    const { dispatch, getState } = createDispatch({
      config: { serviceUrls: { agentServiceApiUrl: 'https://agent-service.test' } },
    });

    const result = await getAccessScope()(dispatch as never, getState as never);

    expect(mockedGet).toHaveBeenCalledWith('https://agent-service.test/agent/v1/access/scope', {
      headers: { Authorization: 'Bearer user-token' },
    });
    expect(result).toEqual(scope);
  });

  it('falls back to the local agent-service URL', async () => {
    mockedGet.mockResolvedValueOnce({ data: {} });
    const { dispatch, getState } = createDispatch({ config: {} });

    await getAccessScope()(dispatch as never, getState as never);

    expect(mockedGet.mock.calls[0][0]).toBe('http://localhost:3380/agent/v1/access/scope');
  });

  it('propagates request failures to the caller', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network Error'));
    const { dispatch, getState } = createDispatch({ config: {} });

    await expect(getAccessScope()(dispatch as never, getState as never)).rejects.toThrow('Network Error');
  });
});

describe('discardThread', () => {
  const agentState = {
    threads: {
      'thread-1': { id: 'thread-1', agent: 'AccessServiceAgent' },
      'thread-2': { id: 'thread-2', agent: 'AccessServiceAgent' },
    },
  };
  const state = { config: { serviceUrls: { agentServiceApiUrl: 'https://agent-service.test' } }, agent: agentState };

  beforeEach(() => {
    mockedDelete.mockReset().mockResolvedValue({ data: { deleted: true } });
    mockSocket.send.mockClear();
  });

  it('clears the thread and deletes it on the server with the user token', async () => {
    const { dispatch, getState } = createDispatch(state);

    await discardThread('thread-1', { deleteOnServer: true })(dispatch as never, getState as never);

    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_THREAD_ACTION, threadId: 'thread-1' });
    expect(mockedDelete).toHaveBeenCalledWith(
      'https://agent-service.test/agent/v1/agents/AccessServiceAgent/threads/thread-1',
      { headers: { Authorization: 'Bearer user-token' } },
    );
  });

  it('only clears the thread when it should be left to expire on the server', async () => {
    const { dispatch, getState } = createDispatch(state);

    await discardThread('thread-1', { deleteOnServer: false })(dispatch as never, getState as never);

    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_THREAD_ACTION, threadId: 'thread-1' });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('does not call the server for a thread it does not know', async () => {
    const { dispatch, getState } = createDispatch(state);

    await discardThread('unknown', { deleteOnServer: true })(dispatch as never, getState as never);

    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_THREAD_ACTION, threadId: 'unknown' });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('still clears the thread when the server cannot delete it', async () => {
    mockedDelete.mockRejectedValueOnce(new Error('Network Error'));
    const { dispatch, getState } = createDispatch(state);

    await expect(
      discardThread('thread-1', { deleteOnServer: true })(dispatch as never, getState as never),
    ).resolves.toBeUndefined();
    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_THREAD_ACTION, threadId: 'thread-1' });
  });

  it('drops messages for the thread that are still waiting to be sent', async () => {
    const { dispatch, getState } = createDispatch(state);
    mockSocket.connected = false;
    await connectAgent()(dispatch as never, getState as never);
    messageAgent('thread-1', {}, [{ type: 'text', text: 'Old question' }])(dispatch as never, getState as never);
    messageAgent('thread-2', {}, [{ type: 'text', text: 'Other question' }])(dispatch as never, getState as never);

    await discardThread('thread-1', { deleteOnServer: false })(dispatch as never, getState as never);
    mockSocket.connected = true;
    mockSocket.handlers.connect();

    expect(mockSocket.send).toHaveBeenCalledTimes(1);
    expect(mockSocket.send).toHaveBeenCalledWith(expect.objectContaining({ threadId: 'thread-2' }));
  });
});
