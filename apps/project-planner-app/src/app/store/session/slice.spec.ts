import Keycloak from 'keycloak-js';
import { configureStore } from '@reduxjs/toolkit';
import { configReducer } from '../config/slice';
import { initializeSession, loginUser, logoutUser, sessionReducer } from './slice';
import { selectIsPlannerAdmin, selectIsPlannerUser } from './selectors';

jest.mock('keycloak-js');

describe('session', () => {
  const KeycloakMock = Keycloak as unknown as jest.Mock;
  const client = {
    init: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    authenticated: false,
    tokenParsed: undefined,
  };
  const access = {
    url: 'https://access.example',
    realm: 'planner-realm',
    client_id: 'urn:ads:platform:project-planner-app',
  };

  const createStore = () =>
    configureStore({
      reducer: { config: configReducer, session: sessionReducer },
      preloadedState: {
        config: { initialized: true, environment: { access }, serviceUrls: {} },
        session: { initialized: false, authenticated: false },
      },
    });

  const plannerRoles = (roles: string[]) => ({
    sub: 'user-1',
    name: 'Pat Planner',
    email: 'pat@example.com',
    resource_access: { 'urn:ads:platform:project-planner-service': { roles } },
  });

  beforeEach(() => {
    KeycloakMock.mockImplementation(() => client);
    client.init.mockResolvedValue(true);
    client.authenticated = false;
    client.tokenParsed = undefined;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates the keycloak client for the planner realm and app client', async () => {
    await createStore().dispatch(initializeSession());

    expect(KeycloakMock).toHaveBeenCalledWith({
      url: 'https://access.example/auth',
      realm: 'planner-realm',
      clientId: 'urn:ads:platform:project-planner-app',
    });
  });

  it('checks for an existing sign-in without forcing one', async () => {
    await createStore().dispatch(initializeSession());

    expect(client.init).toHaveBeenCalledWith(expect.objectContaining({ onLoad: 'check-sso', pkceMethod: 'S256' }));
  });

  it('is initialized but not authenticated when there is no sign-in', async () => {
    const store = createStore();

    await store.dispatch(initializeSession());

    expect(store.getState().session).toEqual(expect.objectContaining({ initialized: true, authenticated: false }));
  });

  it('takes the user and their roles from the token', async () => {
    client.authenticated = true;
    client.tokenParsed = plannerRoles(['planner-user']);
    const store = createStore();

    await store.dispatch(initializeSession());

    expect(store.getState().session).toEqual(
      expect.objectContaining({
        authenticated: true,
        userId: 'user-1',
        userInfo: { name: 'Pat Planner', email: 'pat@example.com' },
        resourceAccess: { 'urn:ads:platform:project-planner-service': { roles: ['planner-user'] } },
      }),
    );
  });

  it('signs in through GoA SSO', async () => {
    const store = createStore();
    await store.dispatch(initializeSession());

    await store.dispatch(loginUser());

    expect(client.login).toHaveBeenCalledWith(expect.objectContaining({ idpHint: 'core' }));
  });

  it('signs out back to the app root', async () => {
    const store = createStore();
    await store.dispatch(initializeSession());

    await store.dispatch(logoutUser());

    expect(client.logout).toHaveBeenCalledWith({ redirectUri: `${window.location.origin}/` });
  });

  describe('selectors', () => {
    const withRoles = (roles: string[]) => ({
      session: {
        initialized: true,
        authenticated: true,
        resourceAccess: { 'urn:ads:platform:project-planner-service': { roles } },
      },
    });

    it.each([
      [['planner-user'], true],
      [['planner-admin'], true],
      [['other-role'], false],
    ])('treats roles %p as a planner user: %p', (roles, expected) => {
      expect(selectIsPlannerUser(withRoles(roles))).toBe(expected);
    });

    it('treats only planner-admin as a planner admin', () => {
      expect(selectIsPlannerAdmin(withRoles(['planner-user']))).toBe(false);
      expect(selectIsPlannerAdmin(withRoles(['planner-admin']))).toBe(true);
    });
  });
});
