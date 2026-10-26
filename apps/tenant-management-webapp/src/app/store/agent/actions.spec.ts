import axios from 'axios';
import { getAccessScope } from './actions';

jest.mock('axios');
jest.mock('@store/tenant/actions', () => ({
  getAccessToken: () => async () => 'user-token',
}));

const mockedGet = axios.get as jest.Mock;

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
