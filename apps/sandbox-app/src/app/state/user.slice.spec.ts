import {
  hasKeycloakSession,
  initializeUser,
  isSessionEndingSoon,
  refreshSession,
  SESSION_REFRESH_WINDOW_SECONDS,
  userActions,
  userReducer,
} from './user.slice';

const mockKeycloak = jest.fn();
jest.mock('keycloak-js', () => ({
  __esModule: true,
  default: jest.fn((...args) => mockKeycloak(...args)),
}));

const appState = {
  config: { environment: { access: { url: 'https://access.adsp-uat.alberta.ca', client_id: 'sandbox-app' } } },
};
const tenant = { id: 'tenant-1', name: 'autotest', realm: 'realm-1' };

describe('user slice', () => {
  test('waits for the same sign-in check when the user is initialized twice', async () => {
    // Arrange
    let finishCheck: () => void;
    const keycloak = {
      realm: tenant.realm,
      authenticated: false,
      tokenParsed: undefined,
      init: jest.fn(() => new Promise<void>((resolve) => (finishCheck = resolve))),
    };
    mockKeycloak.mockReturnValue(keycloak);
    const dispatch = jest.fn();
    const first = initializeUser(tenant)(dispatch, () => appState, undefined);
    const second = initializeUser(tenant)(dispatch, () => appState, undefined);

    // Act
    Object.assign(keycloak, {
      authenticated: true,
      tokenParsed: { sub: 'u1', name: 'Alice Smith', email: 'alice.smith@gov.ab.ca' },
    });
    finishCheck();
    const results = await Promise.all([first, second]);

    // Assert
    expect(results.map(({ payload }) => payload)).toEqual([
      { id: 'u1', name: 'Alice Smith', email: 'alice.smith@gov.ab.ca', roles: [] },
      { id: 'u1', name: 'Alice Smith', email: 'alice.smith@gov.ab.ca', roles: [] },
    ]);
  });

  test('reports no Keycloak session when the sign-in check finds none', async () => {
    // Arrange
    mockKeycloak.mockReturnValue({ realm: 'realm-2', authenticated: false, init: jest.fn(() => Promise.resolve()) });
    await initializeUser({ ...tenant, realm: 'realm-2' })(jest.fn(), () => appState, undefined);

    // Act
    const result = hasKeycloakSession();

    // Assert
    expect(result).toBe(false);
  });

  describe('refreshSession', () => {
    const signInWith = async (realm: string, updateToken: jest.Mock) => {
      mockKeycloak.mockReturnValue({ realm, authenticated: true, init: jest.fn(() => Promise.resolve()), updateToken });
      await initializeUser({ ...tenant, realm })(jest.fn(), () => appState, undefined);
    };

    test('renews the tokens when less than the refresh window is left', async () => {
      // Arrange
      const updateToken = jest.fn(() => Promise.resolve(true));
      await signInWith('realm-3', updateToken);

      // Act
      await refreshSession()(jest.fn(), () => appState, undefined);

      // Assert
      expect(updateToken).toHaveBeenCalledWith(SESSION_REFRESH_WINDOW_SECONDS);
    });

    test('explains that a new sign-in is needed when the session cannot be extended', async () => {
      // Arrange
      await signInWith(
        'realm-4',
        jest.fn(() => Promise.reject(undefined)),
      );

      // Act
      const action = await refreshSession()(jest.fn(), () => appState, undefined);

      // Assert
      expect(action.error.message).toBe('Your session could not be extended. Sign in again to continue.');
    });
  });

  describe('isSessionEndingSoon', () => {
    const signInUntil = async (realm: string, expiresAt: number) => {
      mockKeycloak.mockReturnValue({
        realm,
        authenticated: true,
        refreshTokenParsed: { exp: expiresAt },
        init: jest.fn(() => Promise.resolve()),
      });
      await initializeUser({ ...tenant, realm })(jest.fn(), () => appState, undefined);
    };
    const nowSeconds = () => Math.floor(Date.now() / 1000);

    test('is ending soon once less than the refresh window is left', async () => {
      // Arrange
      await signInUntil('realm-5', nowSeconds() + SESSION_REFRESH_WINDOW_SECONDS - 60);

      // Act
      const result = isSessionEndingSoon();

      // Assert
      expect(result).toBe(true);
    });

    test('is not ending soon while more than the refresh window is left', async () => {
      // Arrange
      await signInUntil('realm-6', nowSeconds() + SESSION_REFRESH_WINDOW_SECONDS + 60);

      // Act
      const result = isSessionEndingSoon();

      // Assert
      expect(result).toBe(false);
    });
  });

  test('remembers that a page keeps the session alive', () => {
    // Arrange
    const state = userReducer(undefined, { type: 'init' });

    // Act
    const next = userReducer(state, userActions.sessionKeepAliveChanged(true));

    // Assert
    expect(next.keepSessionAlive).toBe(true);
  });
});
