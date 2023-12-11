import { TenantService, UnauthorizedUserError, adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import * as passport from 'passport';
import {
  completeAuthenticate,
  createClientRouter,
  getAuthenticationClient,
  getClient,
  logout,
  registerClient,
  startAuthenticate,
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
        },
        ['tk_client']: client,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      client.register.mockResolvedValueOnce({ clientId: 'test-client' });

      const handler = registerClient(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ registered: true }));
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

  describe('getClient', () => {
    it('can create handler', () => {
      const handler = getClient();
      expect(handler).toBeTruthy();
    });

    it('can get client', () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        credentials: { clientId: 'test-client' },
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
      handler(req as unknown as Request, res as unknown as Response, next);

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

    it('can call next with unauthorized for non-admin', () => {
      const client = {
        id: 'test',
        authCallbackUrl: 'https://frontend/auth/callback',
        successRedirectUrl: '/success',
        failureRedirectUrl: '/fail',
        credentials: { clientId: 'test-client' },
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
      handler(req as unknown as Request, res as unknown as Response, next);

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

    it('can logout user', () => {
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
      handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.logout).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('can call next with invalid operation for no user', () => {
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
      handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.logout).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for wrong client', () => {
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
      handler(req as unknown as Request, res as unknown as Response, next);

      expect(req.logout).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });
});
