import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import axios, { AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import 'express-session';
import jwtDecode from 'jwt-decode';
import { PassportStatic } from 'passport';
import { Strategy } from 'passport-openidconnect';
import { Logger } from 'winston';
import { AuthenticationClient } from './client';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;
const { AxiosError } = jest.requireActual('axios');

jest.mock('jwt-decode');
const jwtDecodeMock = jwtDecode as jest.MockedFunction<typeof jwtDecode>;

describe('AuthenticationClient', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const repositoryMock = {
    get: jest.fn(),
    save: jest.fn((credentials) => Promise.resolve(credentials)),
  };

  const passportMock = {
    authenticate: jest.fn(),
  };

  const tenant = {
    id: tenantId,
    name: 'test',
    realm: 'test',
  };

  beforeEach(() => {
    repositoryMock.get.mockClear();
    repositoryMock.save.mockClear();
    axiosMock.post.mockClear();
    axiosMock.delete.mockClear();
    passportMock.authenticate.mockClear();
    jwtDecodeMock.mockClear();
  });

  it('can be created', () => {
    const client = new AuthenticationClient(
      new URL('https://access-service'),
      loggerMock as unknown as Logger,
      directoryMock,
      repositoryMock,
      {
        tenantId,
        id: 'test',
        name: 'test',
        authCallbackUrl: 'https://frontend/callback',
        targets: {},
      }
    );

    expect(client).toBeTruthy();
  });

  describe('register', () => {
    it('can register client', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const registration = {
        client_id: 'test-123',
        client_secret: 'secret secret',
        registration_client_uri: 'http://access-service/registration/clients/test-123',
        registration_access_token: 'reg token 123',
      };
      axiosMock.post.mockResolvedValueOnce({ data: registration });
      repositoryMock.get.mockResolvedValueOnce(null);

      const result = await client.register(tenant, 'abc-123');
      expect(result).toBeTruthy();
    });

    it('can throw invalid operation for unauthorized registration response', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      axiosMock.post.mockRejectedValueOnce(
        new AxiosError('oh noes!', null, null, {}, { status: 401 } as unknown as AxiosResponse)
      );
      axiosMock.isAxiosError.mockReturnValueOnce(true);

      await expect(client.register(tenant, 'abc-123')).rejects.toThrow(InvalidOperationError);
    });

    it('can passthrough error for failed registration response', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      axiosMock.post.mockRejectedValueOnce(new Error('oh noes!'));

      await expect(client.register(tenant, 'abc-123')).rejects.toThrow(Error);
    });

    it('can delete existing', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const registration = {
        client_id: 'test-123',
        client_secret: 'secret secret',
        registration_client_uri: 'http://access-service/registration/clients/test-123',
        registration_access_token: 'reg token 123',
      };
      axiosMock.post.mockResolvedValueOnce({ data: registration });

      const original = {
        realm: tenant.realm,
        clientId: 'old-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/old-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(original);

      await client.register(tenant, 'abc-123');
      expect(axios.delete).toHaveBeenCalledWith(
        original.registrationUrl,
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: `Bearer ${original.registrationToken}` }),
        })
      );
    });

    it('can handle delete error', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const registration = {
        client_id: 'test-123',
        client_secret: 'secret secret',
        registration_client_uri: 'http://access-service/registration/clients/test-123',
        registration_access_token: 'reg token 123',
      };
      axiosMock.post.mockResolvedValueOnce({ data: registration });

      const original = {
        realm: tenant.realm,
        clientId: 'old-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/old-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(original);

      axiosMock.delete.mockRejectedValueOnce(new Error('oh noes!'));

      await client.register(tenant, 'abc-123');
    });
  });

  describe('authenticate', () => {
    it('can create authenticate handler', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const credentials = {
        realm: tenant.realm,
        clientId: 'client-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/client-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(credentials);

      const handler = await client.authenticate(passportMock as unknown as PassportStatic);
      expect(handler).toBeTruthy();
      expect(passportMock.authenticate).toHaveBeenCalledWith(expect.any(Strategy), expect.any(Object));
    });

    it('can create authenticate handler with idp hint', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
          idpHint: 'core',
        }
      );

      const credentials = {
        realm: tenant.realm,
        clientId: 'client-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/client-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(credentials);

      const handler = await client.authenticate(passportMock as unknown as PassportStatic);
      expect(handler).toBeTruthy();
      expect(passportMock.authenticate).toHaveBeenCalledWith(expect.any(Strategy), expect.any(Object));
    });

    it('can throw invalid operation for no credentials', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      repositoryMock.get.mockReturnValueOnce(null);

      await expect(client.authenticate(passportMock as unknown as PassportStatic)).rejects.toThrow(
        InvalidOperationError
      );
    });

    it('can handle initiate request', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const credentials = {
        realm: tenant.realm,
        clientId: 'client-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/client-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(credentials);

      const innerHandler = jest.fn();
      passportMock.authenticate.mockReturnValueOnce(innerHandler);
      const handler = await client.authenticate(passportMock as unknown as PassportStatic);

      const req = { hostname: 'frontend' };
      const res = {};
      const next = jest.fn();

      handler(req as unknown as Request, res as unknown as Response, next);
      expect(innerHandler).toHaveBeenCalledWith(req, res, next);
    });

    it('can handle complete request', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const credentials = {
        realm: tenant.realm,
        clientId: 'client-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/client-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(credentials);

      const innerHandler = jest.fn((_req, _res, next) => next());
      passportMock.authenticate.mockReturnValueOnce(innerHandler);
      const handler = await client.authenticate(passportMock as unknown as PassportStatic, true);

      const req = {
        hostname: 'frontend',
        user: { id: 'test', name: 'tester', refreshExp: 1800 },
        session: { cookie: {} },
      };
      const res = { cookie: jest.fn() };
      const next = jest.fn();

      handler(req as unknown as Request, res as unknown as Response, next);
      expect(innerHandler).toHaveBeenCalledWith(req, res, expect.any(Function));
      expect(next).toHaveBeenCalledWith();
    });

    it('can handle complete request generate csrf error', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const credentials = {
        realm: tenant.realm,
        clientId: 'client-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/client-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(credentials);

      const innerHandler = jest.fn((req, res, next) => next());
      passportMock.authenticate.mockReturnValueOnce(innerHandler);
      const handler = await client.authenticate(passportMock as unknown as PassportStatic, true);

      const req = {
        hostname: 'frontend',
        user: { id: 'test', name: 'tester', refreshExp: 1800 },
        session: { cookie: {} },
        logout: jest.fn((cb) => cb()),
      };
      const res = {};
      const next = jest.fn();

      handler(req as unknown as Request, res as unknown as Response, next);
      expect(innerHandler).toHaveBeenCalledWith(req, res, expect.any(Function));
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('can handle complete request generate csrf error and logout error', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const credentials = {
        realm: tenant.realm,
        clientId: 'client-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/client-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(credentials);

      const innerHandler = jest.fn((req, res, next) => next());
      passportMock.authenticate.mockReturnValueOnce(innerHandler);
      const handler = await client.authenticate(passportMock as unknown as PassportStatic, true);

      const req = {
        hostname: 'frontend',
        user: { id: 'test', name: 'tester', refreshExp: 1800 },
        session: { cookie: {} },
        logout: jest.fn((cb) => cb(new Error('oh noes!'))),
      };
      const res = {};
      const next = jest.fn();

      handler(req as unknown as Request, res as unknown as Response, next);
      expect(innerHandler).toHaveBeenCalledWith(req, res, expect.any(Function));
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('can throw invalid operation for unknown host', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const credentials = {
        realm: tenant.realm,
        clientId: 'client-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/client-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(credentials);

      const innerHandler = jest.fn();
      passportMock.authenticate.mockReturnValueOnce(innerHandler);
      const handler = await client.authenticate(passportMock as unknown as PassportStatic);

      const req = { hostname: 'not-the-same' };
      const res = {};
      const next = jest.fn();

      expect(() => handler(req as unknown as Request, res as unknown as Response, next)).toThrowError(
        InvalidOperationError
      );
    });

    it('can disable verify host', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          disableVerifyHost: true,
          targets: {},
        }
      );

      const credentials = {
        realm: tenant.realm,
        clientId: 'client-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/client-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(credentials);

      const innerHandler = jest.fn((_req, _res, next) => next());
      passportMock.authenticate.mockReturnValueOnce(innerHandler);
      const handler = await client.authenticate(passportMock as unknown as PassportStatic);

      const req = {
        hostname: 'not-the-same',
        user: { id: 'test', name: 'tester', refreshExp: 1800 },
        session: { cookie: {} },
      };
      const res = { cookie: jest.fn() };
      const next = jest.fn();

      handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('refreshTokens', () => {
    it('can refresh tokens', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const sessionData = { refreshToken: 'refresh-123' };
      const req = {
        user: sessionData,
        session: { passport: { user: sessionData } },
      };

      const credentials = {
        realm: tenant.realm,
        clientId: 'client-123',
        clientSecret: 'secret secret',
        registrationUrl: 'http://access-service/registration/clients/client-123',
        registrationToken: 'reg token 123',
      };
      repositoryMock.get.mockReturnValueOnce(credentials);
      const refreshResponse = {
        access_token: 'new-token-123',
        refresh_token: 'new-token-123',
        expires_in: 300,
        refresh_expires_in: 1800,
      };
      axiosMock.post.mockResolvedValue({ data: refreshResponse });

      const token = await client.refreshTokens(req as unknown as Request);
      expect(token).toBe(refreshResponse.access_token);
    });

    it('can throw unauthorized for missing credentials', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const sessionData = { refreshToken: 'refresh-123' };
      const req = {
        user: sessionData,
        session: { passport: { user: sessionData } },
        logout: jest.fn((cb) => cb()),
      };

      await expect(client.refreshTokens(req as unknown as Request)).rejects.toThrow(UnauthorizedError);
      expect(req.logout).toHaveBeenCalled();
    });

    it('can throw unauthorized for missing credentials and handle logout error', async () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const sessionData = { refreshToken: 'refresh-123' };
      const req = {
        user: sessionData,
        session: { passport: { user: sessionData } },
        logout: jest.fn((cb) => cb(new Error('oh noes!'))),
      };

      await expect(client.refreshTokens(req as unknown as Request)).rejects.toThrow(UnauthorizedError);
      expect(req.logout).toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('can verify user', () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const access = {
        sub: 'tester',
        exp: 321,
        realm_access: { roles: ['tester'] },
        resource_access: { test: { roles: ['tester'] } },
      };
      const refresh = { exp: 123 };
      const profile = { displayName: 'Tester', emails: [{ value: 'tester@test.co' }] };
      jwtDecodeMock.mockReturnValueOnce(access).mockReturnValueOnce(refresh);

      const verified = jest.fn();
      client.verify('test-iss', profile, {}, 'id-token', 'access-token', 'refresh-token', verified);
      expect(verified).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          id: access.sub,
          exp: access.exp,
          refreshExp: refresh.exp,
          name: profile.displayName,
          roles: expect.arrayContaining(['tester', 'test:tester']),
        })
      );
    });

    it('can handle token without roles', () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const access = {
        sub: 'tester',
        exp: 321,
      };
      const refresh = { exp: 123 };
      const profile = { displayName: 'Tester', emails: [{ value: 'tester@test.co' }] };
      jwtDecodeMock.mockReturnValueOnce(access).mockReturnValueOnce(refresh);

      const verified = jest.fn();
      client.verify('test-iss', profile, {}, 'id-token', 'access-token', 'refresh-token', verified);
      expect(verified).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          id: access.sub,
          exp: access.exp,
          refreshExp: refresh.exp,
          name: profile.displayName,
          roles: expect.arrayContaining([]),
        })
      );
    });

    it('can handle error', () => {
      const client = new AuthenticationClient(
        new URL('https://access-service'),
        loggerMock as unknown as Logger,
        directoryMock,
        repositoryMock,
        {
          tenantId,
          id: 'test',
          name: 'test',
          authCallbackUrl: 'https://frontend/callback',
          targets: {},
        }
      );

      const profile = { displayName: 'Tester', emails: [{ value: 'tester@test.co' }] };
      jwtDecodeMock.mockImplementationOnce(() => {
        throw new Error('oh noes!');
      });

      const verified = jest.fn();
      client.verify('test-iss', profile, {}, 'id-token', 'access-token', 'refresh-token', verified);
      expect(verified).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
