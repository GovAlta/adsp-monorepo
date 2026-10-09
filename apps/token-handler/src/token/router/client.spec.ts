import { TenantService, UnauthorizedUserError, adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import * as passport from 'passport';
import { Logger } from 'winston';
import {
  completeAuthenticate,
  createClientRouter,
  getAuthenticationClient,
  getClient,
  logout,
  registerClient,
  startAuthenticate,
  updateClient,
} from './client';
import { ServiceRoles } from '../roles';

describe('client router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const configurationMock = {
    getClient: jest.fn(),
  };
  const configurationHandlerMock = jest.fn();

  const eventServiceMock = {
    send: jest.fn(),
  };

  const tenantHandlerMock = jest.fn();

  const tenantServiceMock = {
    getTenant: jest.fn(),
  };

  beforeEach(() => {
    configurationMock.getClient.mockClear();
    eventServiceMock.send.mockClear();
  });

  describe('createClientRouter', () => {
    it('can create router', () => {
      const router = createClientRouter({
        configurationHandler: configurationHandlerMock,
        eventService: eventServiceMock,
        passport,
        tenantHandler: tenantHandlerMock,
        tenantService: tenantServiceMock as unknown as TenantService,
      });
      expect(router).toBeTruthy();
    });
  });

  describe('getAuthenticationClient', () => {
    it('can create handler', () => {
      const handler = getAuthenticationClient();
      expect(handler).toBeTruthy();
    });

    it('can get client', async () => {
      const req = {
        params: { id: 'test' },
        getConfiguration: jest.fn(() => Promise.resolve(configurationMock)),
      };
      const res = {};
      const next = jest.fn();

      const client = {};
      configurationMock.getClient.mockReturnValueOnce(client);

      const handler = getAuthenticationClient();
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req['tk_client']).toBe(client);
      expect(next).toHaveBeenCalledWith();
    });

    it('can call next with not found for unknown client', async () => {
      const req = {
        params: { id: 'test' },
        getConfiguration: jest.fn(() => Promise.resolve(configurationMock)),
      };
      const res = {};
      const next = jest.fn();

      configurationMock.getClient.mockReturnValueOnce(null);

      const handler = getAuthenticationClient();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('registerClient', () => {
    it('can create handler', () => {
      const handler = registerClient(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can register client', async () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        credentials: { clientId: 'test-client' },
        register: jest.fn(),
      };
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'tester',
          roles: [ServiceRoles.Admin],
        },
        body: {
          registrationToken: 'reg-token',
          authCallbackUrl: 'https://frontend/auth/callback',
        },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      client.register.mockResolvedValueOnce({ clientId: 'test-client' });

      const handler = registerClient(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ registered: true }));
      expect(client.register).toHaveBeenCalledWith(req.tenant, 'reg-token', 'https://frontend/auth/callback');
      expect(eventServiceMock.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('can register client without callback URL', async () => {
      const client = {
        id: 'test',
        credentials: { clientId: 'test-client' },
        register: jest.fn().mockResolvedValueOnce({ clientId: 'test-client' }),
      };
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.Admin] },
        body: { registrationToken: 'reg-token' },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = registerClient(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ registered: true }));
      expect(client.register).toHaveBeenCalledWith(req.tenant, 'reg-token', undefined);
      expect(next).not.toHaveBeenCalled();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        credentials: { clientId: 'test-client' },
        register: jest.fn(),
      };
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'tester',
          roles: [],
        },
        body: {
          registrationToken: 'reg-token',
          authCallbackUrl: 'https://frontend/auth/callback',
        },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = registerClient(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('updateClient', () => {
    it('can create handler', () => {
      const handler = updateClient(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can update client registration', async () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        credentials: { clientId: 'test-client' },
        updateRegistration: jest.fn(),
      };
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'tester',
          roles: [ServiceRoles.Admin],
        },
        body: {
          redirectUris: ['https://frontend/auth/callback', 'http://localhost:4200/auth/callback'],
        },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      client.updateRegistration.mockResolvedValueOnce({ clientId: 'test-client' });

      const handler = updateClient(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ updated: true }));
      expect(client.updateRegistration).toHaveBeenCalledWith(req.body.redirectUris);
      expect(eventServiceMock.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        credentials: { clientId: 'test-client' },
        updateRegistration: jest.fn(),
      };
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'tester',
          roles: [],
        },
        body: {
          redirectUris: ['https://frontend/auth/callback'],
        },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateClient(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getClient', () => {
    it('can create handler', () => {
      const handler = getClient();
      expect(handler).toBeTruthy();
    });

    it('can get client', async () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        getCredentials: jest.fn().mockResolvedValue({ clientId: 'test-client' }),
      };
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'tester',
          roles: [ServiceRoles.Admin],
        },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getClient();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test',
          authCallbackUrl: 'https://frontend/auth/callback',
          successRedirectUrl: '/success',
          failureRedirectUrl: '/fail',
          clientId: 'test-client',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('can get unregistered client', async () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        getCredentials: jest.fn().mockResolvedValue(undefined),
      };
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', roles: [ServiceRoles.Admin] },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getClient();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'test', clientId: undefined }));
      expect(next).not.toHaveBeenCalled();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        getCredentials: jest.fn().mockResolvedValue({ clientId: 'test-client' }),
      };
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'tester',
          roles: [],
        },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getClient();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('startAuthenticate', () => {
    it('can create handler', () => {
      const handler = startAuthenticate(passport);
      expect(handler).toBeTruthy();
    });

    it('can start authentication flow', async () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        credentials: { clientId: 'test-client' },
        authenticate: jest.fn(),
      };
      const req = {
        tenant: {
          id: tenantId,
        },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const authenticateHandler = jest.fn();
      client.authenticate.mockResolvedValueOnce(authenticateHandler);

      const handler = startAuthenticate(passport);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(authenticateHandler).toHaveBeenCalledWith(req, res, next);
      expect(client.authenticate).toHaveBeenCalledWith(passport);
    });
  });

  describe('completeAuthenticate', () => {
    it('can create handler', () => {
      const handler = completeAuthenticate(passport);
      expect(handler).toBeTruthy();
    });

    it('can complete authentication flow', async () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        credentials: { clientId: 'test-client' },
        authenticate: jest.fn(),
      };
      const req = {
        tenant: {
          id: tenantId,
        },
        ['tk_client']: client,
        isAuthenticated: jest.fn(() => true),
      };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      const authenticateHandler = jest.fn((_req, _res, next) => next());
      client.authenticate.mockResolvedValueOnce(authenticateHandler);

      const handler = completeAuthenticate(passport);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(authenticateHandler).toHaveBeenCalledWith(req, res, expect.any(Function));
      expect(client.authenticate).toHaveBeenCalledWith(passport, true);
      expect(res.redirect).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('can create handler', () => {
      const handler = logout();
      expect(handler).toBeTruthy();
    });

    it('can logout user', async () => {
      const req = {
        params: { id: 'test' },
        tenant: {
          id: tenantId,
        },
        user: {
          authenticatedBy: 'test',
        },
        logout: jest.fn((cb) => cb()),
      };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      const handler = logout();
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.logout).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/');
      expect(next).not.toHaveBeenCalled();
    });

    describe('access service logout', () => {
      const user = { id: 'tester', tenantId, authenticatedBy: 'test', idToken: 'id-token' };
      const loggerMock = { warn: jest.fn(), info: jest.fn() };

      const createRequest = (headers: Record<string, string> = {}, overrides: Record<string, unknown> = {}) => ({
        params: { id: 'test' },
        get: jest.fn((name: string) => headers[name]),
        session: { postLogoutRedirectUri: 'https://app.example.ca/' },
        user,
        logout: jest.fn((cb) => cb()),
        getConfiguration: jest.fn().mockResolvedValue(configurationMock),
        ...overrides,
      });

      const createClient = (logoutUrl: string | null = 'https://access/logout?id_token_hint=id-token') => ({
        id: 'test',
        keycloakLogout: true,
        getLogoutUrl: jest.fn().mockResolvedValue(logoutUrl),
      });

      const run = async (req: unknown, logger = loggerMock) => {
        const res = { redirect: jest.fn() };
        const next = jest.fn();
        await logout(logger as unknown as Logger)(req as Request, res as unknown as Response, next);
        return { res, next };
      };

      beforeEach(() => {
        loggerMock.warn.mockClear();
        loggerMock.info.mockClear();
        configurationMock.getClient.mockReset();
      });

      it('can redirect to access service to end the session', async () => {
        const client = createClient();
        configurationMock.getClient.mockReturnValueOnce(client);
        const req = createRequest();

        const { res, next } = await run(req);

        expect(configurationMock.getClient).toHaveBeenCalledWith('test');
        expect(client.getLogoutUrl).toHaveBeenCalledWith('id-token', 'https://app.example.ca/');
        expect(req.logout).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('https://access/logout?id_token_hint=id-token');
        expect(next).not.toHaveBeenCalled();
        expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('tester'), expect.anything());
      });

      it.each(['same-origin', 'same-site', 'none', undefined])(
        'can end the access service session for a request with fetch site %s',
        async (site) => {
          configurationMock.getClient.mockReturnValueOnce(createClient());

          const { res } = await run(createRequest(site ? { 'sec-fetch-site': site } : {}));

          expect(res.redirect).toHaveBeenCalledWith('https://access/logout?id_token_hint=id-token');
        }
      );

      it('can read the access service logout URL before the user is logged out', async () => {
        const order: string[] = [];
        const client = {
          id: 'test',
          keycloakLogout: true,
          getLogoutUrl: jest.fn(async () => {
            order.push('url');
            return 'https://access/logout';
          }),
        };
        configurationMock.getClient.mockReturnValueOnce(client);
        const req = createRequest(
          {},
          {
            logout: jest.fn((cb) => {
              order.push('logout');
              cb();
            }),
          }
        );

        await run(req);

        expect(order).toEqual(['url', 'logout']);
      });

      it('can logout locally without ending the access service session for a cross-site request', async () => {
        const client = createClient();
        configurationMock.getClient.mockReturnValueOnce(client);
        const req = createRequest({ 'sec-fetch-site': 'cross-site' });

        const { res, next } = await run(req);

        expect(client.getLogoutUrl).not.toHaveBeenCalled();
        expect(req.logout).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/');
        expect(next).not.toHaveBeenCalled();
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('cross-site'), expect.anything());
      });

      it('can logout locally when the client is not configured for access service logout', async () => {
        const client = { ...createClient(), keycloakLogout: false };
        configurationMock.getClient.mockReturnValueOnce(client);
        const req = createRequest();

        const { res } = await run(req);

        expect(client.getLogoutUrl).not.toHaveBeenCalled();
        expect(req.logout).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/');
        expect(loggerMock.warn).not.toHaveBeenCalled();
      });

      it('can logout locally when the client is not in the configuration', async () => {
        configurationMock.getClient.mockReturnValueOnce(undefined);
        const req = createRequest();

        const { res } = await run(req);

        expect(req.logout).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/');
      });

      it('can logout locally and log when the session has nowhere to return the user to', async () => {
        const client = createClient();
        configurationMock.getClient.mockReturnValueOnce(client);
        const req = createRequest({}, { session: {} });

        const { res } = await run(req);

        expect(client.getLogoutUrl).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/');
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('token handler session only'), expect.anything());
      });

      it('can logout locally and log when access service logout is not available for the session', async () => {
        configurationMock.getClient.mockReturnValueOnce(createClient(null));
        const req = createRequest();

        const { res } = await run(req);

        expect(req.logout).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/');
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('token handler session only'), expect.anything());
      });

      it('can logout locally when the configuration cannot be retrieved', async () => {
        const req = createRequest({}, { getConfiguration: jest.fn().mockRejectedValue(new Error('unavailable')) });

        const { res, next } = await run(req);

        expect(req.logout).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/');
        expect(next).not.toHaveBeenCalled();
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('unavailable'), expect.anything());
      });

      it('can call next with the error if logout fails', async () => {
        const error = new Error('failed');
        configurationMock.getClient.mockReturnValueOnce(createClient('https://a/b'));
        const req = createRequest({}, { logout: jest.fn((cb) => cb(error)) });

        const { res, next } = await run(req);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.redirect).not.toHaveBeenCalled();
      });
    });

    it('can call next with invalid operation for no user', async () => {
      const req = {
        params: { id: 'test' },
        tenant: {
          id: tenantId,
        },
        logout: jest.fn((cb) => cb()),
      };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      const handler = logout();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.logout).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for wrong client', async () => {
      const req = {
        params: { id: 'test' },
        tenant: {
          id: tenantId,
        },
        user: {
          authenticatedBy: 'not-test',
        },
        logout: jest.fn((cb) => cb()),
      };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      const handler = logout();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.logout).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });
});
