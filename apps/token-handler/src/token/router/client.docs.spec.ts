import { adspId, ServiceDirectory, Tenant, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import axios, { AxiosError } from 'axios';
import * as express from 'express';
import { Express, Request } from 'express';
import * as session from 'express-session';
import { Passport, Strategy } from 'passport';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';

import { TokenHandlerConfiguration } from '../configuration';
import { ServiceRoles } from '../roles';
import { ClientCredentials, UserSessionData } from '../types';
import { createClientRouter } from './client';

// Bearer tokens are resolved by the tenant strategy of the SDK; this one accepts the tokens of the test users.
class TestTenantStrategy extends Strategy {
  constructor(private users: Record<string, User>) {
    super();
  }

  authenticate(req: Request) {
    const user = this.users[req.headers.authorization?.replace(/^Bearer /, '')];
    if (user) {
      this.success(user);
    } else {
      this.fail(401);
    }
  }
}

// Verifies the roles, request validation, and error responses documented in client.swagger.yml by sending requests
// through the client router as mounted in the service, with the real error handler.
describe('client router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
  const tenant: Tenant = { id: tenantId, name: 'My Tenant', realm: 'my-realm' };
  const accessServiceUrl = new URL('https://access.adsp.alberta.ca');
  const callbackUrl = 'https://myapp.example.ca/token-handler/clients/my-client/callback';
  const documented = createDocumentedResponseRecorder(join(__dirname, 'client.swagger.yml'));

  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const eventServiceMock = { send: jest.fn() };
  const directoryMock = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() } as unknown as ServiceDirectory;
  const credentials: ClientCredentials = {
    realm: tenant.realm,
    clientId: '3f2a9c1e-7b4d-4e8a-9c2f-1a2b3c4d5e6f',
    clientSecret: 'client-secret',
    registrationUrl: `${accessServiceUrl.href}auth/realms/my-realm/clients-registrations/openid-connect/abc`,
    registrationToken: 'registration-token',
  };
  const repositoryMock = {
    get: jest.fn(),
    save: jest.fn(async (_client, saved: ClientCredentials) => saved),
  };

  const tenantUser = (roles: string[]) =>
    ({ id: 'tester', name: 'Test User', email: 'test.user@gov.ab.ca', tenantId, isCore: false, roles }) as User;
  const users = { admin: tenantUser([ServiceRoles.Admin]), plain: tenantUser([]) };
  const sessionUser = (authenticatedBy: string): UserSessionData => ({
    ...tenantUser([]),
    token: null,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    idToken: 'id-token',
    exp: Date.now() / 1000 + 300,
    refreshExp: Date.now() / 1000 + 1800,
    authenticatedBy,
  });

  function createApp(): Express {
    const configuration = new TokenHandlerConfiguration(
      accessServiceUrl,
      loggerMock,
      directoryMock,
      repositoryMock,
      tenantId,
      {
        clients: {
          'my-client': { id: 'my-client', name: 'My client', targets: {}, failureRedirectUrl: '/sign-in-failed' },
          'unregistered-client': { id: 'unregistered-client', name: 'Unregistered client', targets: {} },
          'logout-client': { id: 'logout-client', name: 'Logout client', keycloakLogout: true, targets: {} },
          'builder-preview': { id: 'builder-preview', name: 'Builder preview', core: true, targets: {} },
        },
      },
    );

    const passport = new Passport();
    passport.use('tenant', new TestTenantStrategy(users));
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user: Express.User, done) => done(null, user));

    const app = express();
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false, cookie: { secure: false } }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Signs in a user on the session, as completing sign in does.
    app.get('/test/sign-in/:client', (req, res, next) =>
      req.login(sessionUser(req.params.client), (err) => {
        req.session['postLogoutRedirectUri'] = 'https://myapp.example.ca/';
        return err ? next(err) : res.sendStatus(204);
      }),
    );

    app.use('/token-handler/v1', documented.middleware);
    app.use(
      '/token-handler/v1',
      createClientRouter({
        // configurationHandler and tenantHandler are SDK handlers; tenant users act on the tenant of their token.
        configurationHandler: (req, _res, next) => {
          req.getConfiguration = jest.fn().mockResolvedValue(configuration) as typeof req.getConfiguration;
          next();
        },
        tenantHandler: (req, _res, next) => {
          req.tenant = req.user ? tenant : undefined;
          next();
        },
        eventService: eventServiceMock,
        logger: loggerMock,
        passport: passport as never,
        tenantService: tenantServiceMock,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryMock.get.mockImplementation(async ({ id }) => (id === 'unregistered-client' ? null : credentials));
    tenantServiceMock.getTenant.mockImplementation(async (id) =>
      id.toString() === tenantId.toString() ? tenant : null,
    );
    tenantServiceMock.getTenantByName.mockImplementation(async (name: string) =>
      name.toLowerCase() === 'my tenant' ? tenant : null,
    );
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await documented.assertDocumented();
  });

  describe('GET /token-handler/v1/clients', () => {
    it('returns the clients of the tenant and the core configuration', async () => {
      const res = await request(createApp()).get('/token-handler/v1/clients').auth('admin', { type: 'bearer' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(4);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'my-client', core: false, registered: true, clientId: credentials.clientId }),
          expect.objectContaining({ id: 'unregistered-client', registered: false }),
        ]),
      );
    });

    it('returns only the core clients', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients?core=true')
        .auth('admin', { type: 'bearer' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: 'builder-preview', core: true })]);
    });

    it('returns 400 for an invalid core value', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients?core=yes')
        .auth('admin', { type: 'bearer' });

      expect(res.status).toBe(400);
    });

    it('returns 401 without a bearer token', async () => {
      const res = await request(createApp()).get('/token-handler/v1/clients');

      expect(res.status).toBe(401);
    });

    it('returns 403 for a user without the token-handler-admin role', async () => {
      const res = await request(createApp()).get('/token-handler/v1/clients').auth('plain', { type: 'bearer' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /token-handler/v1/clients/{clientId}', () => {
    it('returns the client', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/my-client')
        .auth('admin', { type: 'bearer' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: 'my-client',
          clientId: credentials.clientId,
          failureRedirectUrl: '/sign-in-failed',
        }),
      );
    });

    it('returns 400 for a client ID that is too long', async () => {
      const res = await request(createApp())
        .get(`/token-handler/v1/clients/${'a'.repeat(51)}`)
        .auth('admin', { type: 'bearer' });

      expect(res.status).toBe(400);
    });

    it('returns 401 without a bearer token', async () => {
      const res = await request(createApp()).get('/token-handler/v1/clients/my-client');

      expect(res.status).toBe(401);
    });

    it('returns 403 for a user without the token-handler-admin role', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/my-client')
        .auth('plain', { type: 'bearer' });

      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown client', async () => {
      const res = await request(createApp()).get('/token-handler/v1/clients/unknown').auth('admin', { type: 'bearer' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /token-handler/v1/clients/{clientId}', () => {
    const registration = {
      data: {
        client_id: 'a1b2c3d4-e5f6-4789-8abc-def012345678',
        client_secret: 'new-secret',
        registration_client_uri: `${accessServiceUrl.href}auth/realms/my-realm/clients-registrations/openid-connect/def`,
        registration_access_token: 'new-registration-token',
      },
    };

    it('registers the client and sends the client-registered event', async () => {
      const post = jest.spyOn(axios, 'post').mockResolvedValueOnce(registration);
      jest.spyOn(axios, 'delete').mockResolvedValueOnce({});

      const res = await request(createApp())
        .post('/token-handler/v1/clients/my-client')
        .auth('admin', { type: 'bearer' })
        .send({ registrationToken: 'initial-access-token', authCallbackUrl: callbackUrl });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ registered: true });
      expect(post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/realms/my-realm/clients-registrations/openid-connect'),
        expect.objectContaining({ redirect_uris: [callbackUrl] }),
        expect.any(Object),
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'client-registered' }));
    });

    it('returns 400 without a registration token', async () => {
      const res = await request(createApp())
        .post('/token-handler/v1/clients/my-client')
        .auth('admin', { type: 'bearer' })
        .send({ authCallbackUrl: callbackUrl });

      expect(res.status).toBe(400);
    });

    it('returns 400 for a callback URL without a protocol', async () => {
      const res = await request(createApp())
        .post('/token-handler/v1/clients/my-client')
        .auth('admin', { type: 'bearer' })
        .send({ registrationToken: 'initial-access-token', authCallbackUrl: 'myapp.example.ca/callback' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when access service rejects the registration token', async () => {
      jest
        .spyOn(axios, 'post')
        .mockRejectedValueOnce(new AxiosError('Unauthorized', '401', undefined, undefined, { status: 401 } as never));

      const res = await request(createApp())
        .post('/token-handler/v1/clients/my-client')
        .auth('admin', { type: 'bearer' })
        .send({ registrationToken: 'expired-token' });

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('Registration request failed. Verify registration token.');
    });

    it('returns 401 without a bearer token', async () => {
      const res = await request(createApp())
        .post('/token-handler/v1/clients/my-client')
        .send({ registrationToken: 'initial-access-token' });

      expect(res.status).toBe(401);
    });

    it('returns 403 for a user without the token-handler-admin role', async () => {
      const res = await request(createApp())
        .post('/token-handler/v1/clients/my-client')
        .auth('plain', { type: 'bearer' })
        .send({ registrationToken: 'initial-access-token' });

      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown client', async () => {
      const res = await request(createApp())
        .post('/token-handler/v1/clients/unknown')
        .auth('admin', { type: 'bearer' })
        .send({ registrationToken: 'initial-access-token' });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /token-handler/v1/clients/{clientId}', () => {
    const redirectUris = [callbackUrl, 'http://localhost:4200/token-handler/clients/my-client/callback'];

    it('updates the redirect URIs of the registration', async () => {
      const put = jest
        .spyOn(axios, 'put')
        .mockResolvedValueOnce({ data: { client_id: credentials.clientId, registration_access_token: 'next-token' } });

      const res = await request(createApp())
        .put('/token-handler/v1/clients/my-client')
        .auth('admin', { type: 'bearer' })
        .send({ redirectUris });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ updated: true });
      expect(put).toHaveBeenCalledWith(
        credentials.registrationUrl,
        expect.objectContaining({ redirect_uris: redirectUris }),
        expect.any(Object),
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'client-registered' }));
    });

    it('returns 400 for an empty list of redirect URIs', async () => {
      const res = await request(createApp())
        .put('/token-handler/v1/clients/my-client')
        .auth('admin', { type: 'bearer' })
        .send({ redirectUris: [] });

      expect(res.status).toBe(400);
    });

    it('returns 400 for a client that is not registered', async () => {
      const res = await request(createApp())
        .put('/token-handler/v1/clients/unregistered-client')
        .auth('admin', { type: 'bearer' })
        .send({ redirectUris });

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('Client not registered.');
    });

    it('returns 401 without a bearer token', async () => {
      const res = await request(createApp()).put('/token-handler/v1/clients/my-client').send({ redirectUris });

      expect(res.status).toBe(401);
    });

    it('returns 403 for a user without the token-handler-admin role', async () => {
      const res = await request(createApp())
        .put('/token-handler/v1/clients/my-client')
        .auth('plain', { type: 'bearer' })
        .send({ redirectUris });

      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown client', async () => {
      const res = await request(createApp())
        .put('/token-handler/v1/clients/unknown')
        .auth('admin', { type: 'bearer' })
        .send({ redirectUris });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /token-handler/v1/clients/{clientId}/auth', () => {
    it('redirects to the authorization endpoint of the tenant realm', async () => {
      const res = await request(createApp()).get('/token-handler/v1/clients/my-client/auth').query({
        tenant: 'my-tenant',
        callbackUrl,
      });

      expect(res.status).toBe(302);
      const location = new URL(res.headers.location);
      expect(location.origin + location.pathname).toBe(
        'https://access.adsp.alberta.ca/auth/realms/my-realm/protocol/openid-connect/auth',
      );
      expect(location.searchParams.get('client_id')).toBe(credentials.clientId);
      expect(location.searchParams.get('redirect_uri')).toBe(callbackUrl);
    });

    it('uses the tenant of the X-ADSP-TENANT header', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/my-client/auth')
        .set('X-ADSP-TENANT', 'My Tenant')
        .query({ callbackUrl });

      expect(res.status).toBe(302);
    });

    it('returns 400 without a tenant', async () => {
      const res = await request(createApp()).get('/token-handler/v1/clients/my-client/auth').query({ callbackUrl });

      expect(res.status).toBe(400);
    });

    it('returns 400 for an invalid callback URL', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/my-client/auth')
        .query({ tenant: 'my-tenant', callbackUrl: 'javascript:alert(1)' });

      expect(res.status).toBe(400);
    });

    it('returns 400 without a callback URL for a client without authCallbackUrl', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/my-client/auth')
        .query({ tenant: 'my-tenant' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for a client that is not registered', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/unregistered-client/auth')
        .query({ tenant: 'my-tenant', callbackUrl });

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('Cannot use client to authenticate before registration.');
    });

    it('returns 404 for an unknown tenant', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/my-client/auth')
        .query({ tenant: 'other-tenant', callbackUrl });

      expect(res.status).toBe(404);
    });

    it('returns 404 for an unknown client', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/unknown/auth')
        .query({ tenant: 'my-tenant', callbackUrl });

      expect(res.status).toBe(404);
    });

    it('returns 429 after 100 requests in 5 minutes', async () => {
      const app = createApp();

      const statuses = [];
      for (let i = 0; i < 101; i++) {
        const res = await request(app).get('/token-handler/v1/clients/unknown/auth').query({ tenant: 'my-tenant' });
        statuses.push(res.status);
      }

      expect(statuses.slice(0, 100).every((status) => status === 404)).toBe(true);
      expect(statuses[100]).toBe(429);
    });
  });

  describe('GET /token-handler/v1/clients/{clientId}/callback', () => {
    it('redirects to the failureRedirectUrl when sign in is denied', async () => {
      const agent = request.agent(createApp());
      await agent.get('/token-handler/v1/clients/my-client/auth').query({ tenant: 'my-tenant', callbackUrl });

      const res = await agent.get('/token-handler/v1/clients/my-client/callback').query({ error: 'access_denied' });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sign-in-failed');
    });

    it('returns 400 without a tenant from the header or the session', async () => {
      const res = await request(createApp()).get('/token-handler/v1/clients/my-client/callback');

      expect(res.status).toBe(400);
    });

    it('redirects to the failureRedirectUrl when sign in was not started on the session', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/my-client/callback')
        .set('X-ADSP-TENANT', 'my-tenant');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sign-in-failed');
    });

    it('returns 404 for an unknown tenant', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/my-client/callback')
        .set('X-ADSP-TENANT', 'other-tenant');

      expect(res.status).toBe(404);
    });

    it('returns 404 for an unknown client', async () => {
      const res = await request(createApp())
        .get('/token-handler/v1/clients/unknown/callback')
        .set('X-ADSP-TENANT', 'my-tenant');

      expect(res.status).toBe(404);
    });

    it('returns 429 after 100 requests in 5 minutes', async () => {
      const app = createApp();

      const statuses = [];
      for (let i = 0; i < 101; i++) {
        const res = await request(app).get('/token-handler/v1/clients/my-client/callback');
        statuses.push(res.status);
      }

      expect(statuses[100]).toBe(429);
    });
  });

  describe('GET /token-handler/v1/clients/{clientId}/logout', () => {
    it('ends the session and redirects to the root of the site', async () => {
      const agent = request.agent(createApp());
      await agent.get('/test/sign-in/my-client');

      const res = await agent.get('/token-handler/v1/clients/my-client/logout');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/');
    });

    it('redirects to the access service end session endpoint for a client with keycloakLogout', async () => {
      const agent = request.agent(createApp());
      await agent.get('/test/sign-in/logout-client');

      const res = await agent.get('/token-handler/v1/clients/logout-client/logout');

      expect(res.status).toBe(302);
      const location = new URL(res.headers.location);
      expect(location.pathname).toBe('/auth/realms/my-realm/protocol/openid-connect/logout');
      expect(location.searchParams.get('post_logout_redirect_uri')).toBe('https://myapp.example.ca/');
    });

    it('returns 400 when no user is signed in', async () => {
      const res = await request(createApp()).get('/token-handler/v1/clients/my-client/logout');

      expect(res.status).toBe(400);
    });

    it('returns 400 for a user that signed in with another client', async () => {
      const agent = request.agent(createApp());
      await agent.get('/test/sign-in/logout-client');

      const res = await agent.get('/token-handler/v1/clients/my-client/logout');

      expect(res.status).toBe(400);
    });

    it('returns 429 after 100 requests in 5 minutes', async () => {
      const app = createApp();

      const statuses = [];
      for (let i = 0; i < 101; i++) {
        const res = await request(app).get('/token-handler/v1/clients/my-client/logout');
        statuses.push(res.status);
      }

      expect(statuses[100]).toBe(429);
    });
  });
});
