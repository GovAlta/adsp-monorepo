import { configureStore } from '@reduxjs/toolkit';
import { getKeycloakClient } from '../session/keycloak';
import { sessionReducer } from '../session/slice';
import { getAccessToken } from './actions';

jest.mock('../session/keycloak', () => ({ getKeycloakClient: jest.fn() }));

describe('getAccessToken', () => {
  const client = { updateToken: jest.fn(), token: 'token-1' };

  const createStore = () =>
    configureStore({
      reducer: { session: sessionReducer },
      preloadedState: { session: { initialized: true, authenticated: true } },
    });

  beforeEach(() => {
    (getKeycloakClient as jest.Mock).mockReturnValue(client);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('refreshes a token that expires within a minute, then returns it', async () => {
    client.updateToken.mockResolvedValue(true);

    const token = await createStore().dispatch(getAccessToken());

    expect(client.updateToken).toHaveBeenCalledWith(60);
    expect(token).toBe('token-1');
  });

  it('signs the user out of the app when the token cannot be refreshed', async () => {
    client.updateToken.mockRejectedValue(new Error('expired'));
    const store = createStore();

    const token = await store.dispatch(getAccessToken());

    expect(token).toBeUndefined();
    expect(store.getState().session.authenticated).toBe(false);
  });
});
