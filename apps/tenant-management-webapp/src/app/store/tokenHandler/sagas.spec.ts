import axios from 'axios';
import { runSaga } from 'redux-saga';
import { getAccessToken } from '@store/tenant/sagas';
import { deleteTokenHandlerClient, getClientRegistration, registerTokenHandlerClient } from './sagas';
import {
  DeleteTokenHandlerClient,
  GetClientRegistration,
  DELETE_TOKEN_HANDLER_CLIENT_FAILED,
  DELETE_TOKEN_HANDLER_CLIENT_SUCCESS,
  RegisterTokenHandlerClient,
  GET_CLIENT_REGISTRATION,
  GET_CLIENT_REGISTRATION_FAILED,
  GET_CLIENT_REGISTRATION_SUCCESS,
  REGISTER_TOKEN_HANDLER_CLIENT_SUCCESS,
} from './actions';

jest.mock('axios');
jest.mock('@store/tenant/sagas', () => ({ getAccessToken: jest.fn() }));

const axiosMock = axios as jest.Mocked<typeof axios>;

describe('getClientRegistration', () => {
  const state = {
    config: { serviceUrls: { tokenHandlerApiUrl: 'https://token-handler', keycloakUrl: 'https://keycloak' } },
    session: { realm: 'test' },
  };

  const run = async () => {
    const dispatched: { type: string; payload?: unknown }[] = [];
    await runSaga(
      { dispatch: (action) => dispatched.push(action), getState: () => state },
      function* () {
        yield* getClientRegistration(GetClientRegistration('my-client'));
      },
    ).toPromise();
    return dispatched;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (getAccessToken as jest.Mock).mockReturnValue('token');
    axiosMock.isAxiosError.mockImplementation((err: unknown): err is import('axios').AxiosError => !!(err as { isAxiosError?: boolean })?.isAxiosError);
  });

  it('records the Keycloak client and its internal id', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { clientId: 'kc-client' } });
    axiosMock.get.mockResolvedValueOnce({ data: [{ id: 'uuid-1', clientId: 'kc-client' }] });

    const dispatched = await run();

    expect(axiosMock.get).toHaveBeenLastCalledWith(
      'https://keycloak/auth/admin/realms/test/clients',
      expect.objectContaining({ params: { clientId: 'kc-client' } }),
    );
    expect(dispatched).toContainEqual({
      type: GET_CLIENT_REGISTRATION_SUCCESS,
      payload: { clientId: 'my-client', keycloakClientId: 'kc-client', keycloakUuid: 'uuid-1' },
    });
  });

  it('still records the registration when the Keycloak id lookup fails', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { clientId: 'kc-client' } });
    axiosMock.get.mockRejectedValueOnce(new Error('forbidden'));

    const dispatched = await run();

    expect(dispatched).toContainEqual({
      type: GET_CLIENT_REGISTRATION_SUCCESS,
      payload: { clientId: 'my-client', keycloakClientId: 'kc-client', keycloakUuid: undefined },
    });
  });

  it('records a 404 as not registered', async () => {
    axiosMock.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });

    const dispatched = await run();

    expect(dispatched).toContainEqual({
      type: GET_CLIENT_REGISTRATION_SUCCESS,
      payload: { clientId: 'my-client', keycloakClientId: null, keycloakUuid: undefined },
    });
    expect(axiosMock.get).toHaveBeenCalledTimes(1);
  });

  it('records other errors as failed rather than not registered', async () => {
    axiosMock.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 500 } });

    const dispatched = await run();

    expect(dispatched).toContainEqual({ type: GET_CLIENT_REGISTRATION_FAILED, payload: { clientId: 'my-client' } });
    expect(dispatched.map((a) => a.type)).not.toContain(GET_CLIENT_REGISTRATION_SUCCESS);
  });
});

describe('registerTokenHandlerClient', () => {
  const state = {
    config: { serviceUrls: { tokenHandlerApiUrl: 'https://token-handler', keycloakUrl: 'https://keycloak' } },
    session: { realm: 'test' },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (getAccessToken as jest.Mock).mockReturnValue('token');
  });

  it('registers the client with only the registration token and refreshes the registration', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { token: 'initial-access' } });
    axiosMock.post.mockResolvedValueOnce({ data: { registered: true } });
    const dispatched: { type: string }[] = [];

    await runSaga({ dispatch: (action) => dispatched.push(action), getState: () => state }, function* () {
      yield* registerTokenHandlerClient(RegisterTokenHandlerClient('my-client'));
    }).toPromise();

    expect(axiosMock.post).toHaveBeenLastCalledWith(
      'https://token-handler/token-handler/v1/clients/my-client',
      { registrationToken: 'initial-access' },
      expect.anything(),
    );
    expect(dispatched.map((a) => a.type)).toEqual(
      expect.arrayContaining([REGISTER_TOKEN_HANDLER_CLIENT_SUCCESS, GET_CLIENT_REGISTRATION]),
    );
  });

  it('clears the busy state when the service is not available', async () => {
    const dispatched: { type: string }[] = [];

    await runSaga(
      { dispatch: (action) => dispatched.push(action), getState: () => ({ ...state, config: { serviceUrls: {} } }) },
      function* () {
        yield* registerTokenHandlerClient(RegisterTokenHandlerClient('my-client'));
      },
    ).toPromise();

    expect(axiosMock.post).not.toHaveBeenCalled();
    expect(dispatched.map((a) => a.type)).toContain(REGISTER_TOKEN_HANDLER_CLIENT_SUCCESS);
  });
});

describe('deleteTokenHandlerClient', () => {
  const state = {
    config: { serviceUrls: { configurationServiceApiUrl: 'https://configuration' } },
    tokenHandler: { clients: { 'my-client': { id: 'my-client' } } },
  };

  const run = async () => {
    const dispatched: { type: string }[] = [];
    await runSaga({ dispatch: (action) => dispatched.push(action), getState: () => state }, function* () {
      yield* deleteTokenHandlerClient(DeleteTokenHandlerClient('my-client'));
    }).toPromise();
    return dispatched.map((a) => a.type);
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (getAccessToken as jest.Mock).mockReturnValue('token');
  });

  it('deletes the client configuration property', async () => {
    axiosMock.patch.mockResolvedValueOnce({ data: {} });

    const types = await run();

    expect(axiosMock.patch).toHaveBeenCalledWith(
      'https://configuration/configuration/v2/configuration/platform/token-handler',
      { operation: 'DELETE', property: 'clients.my-client' },
      expect.anything(),
    );
    expect(types).toContain(DELETE_TOKEN_HANDLER_CLIENT_SUCCESS);
  });

  it('reports a failed delete so the client is not treated as deleted', async () => {
    axiosMock.patch.mockRejectedValueOnce(new Error('failed'));

    const types = await run();

    expect(types).toContain(DELETE_TOKEN_HANDLER_CLIENT_FAILED);
    expect(types).not.toContain(DELETE_TOKEN_HANDLER_CLIENT_SUCCESS);
  });
});
