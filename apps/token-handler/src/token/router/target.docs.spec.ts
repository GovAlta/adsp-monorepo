import { adspId, AdspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import * as session from 'express-session';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { Passport } from 'passport';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';

import { TokenHandlerConfiguration } from '../configuration';
import { ClientCredentials, UserSessionData } from '../types';
import { createTargetRouter } from './target';

// Verifies the responses documented in target.swagger.yml by sending requests through the target router as mounted in
// the service, with the real error handler, and proxying them to a local upstream.
describe('target router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
  const csrfToken = '6f1c2d3e4a5b69788796a5b4c3d2e1f0';
  const documented = createDocumentedResponseRecorder(join(__dirname, 'target.swagger.yml'));
  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;

  const credentials: ClientCredentials = {
    realm: 'my-realm',
    clientId: '3f2a9c1e-7b4d-4e8a-9c2f-1a2b3c4d5e6f',
    clientSecret: 'client-secret',
    registrationUrl: 'https://access.adsp.alberta.ca/auth/realms/my-realm/clients-registrations/openid-connect/abc',
    registrationToken: 'registration-token',
  };
  const repositoryMock = {
    get: jest.fn(async ({ id }) => (id === 'my-client' ? credentials : null)),
    save: jest.fn(),
  };

  let upstream: Server;
  let upstreamUrl: URL;
  const upstreamRequests: { method: string; path: string; authorization: string }[] = [];
  const directoryMock = {
    getServiceUrl: jest.fn(async (id: AdspId) => (id.service === 'form-service' ? upstreamUrl : null)),
    getResourceUrl: jest.fn(),
  } as unknown as ServiceDirectory;

  const sessionUser = (authenticatedBy: string, expiresIn = 300): UserSessionData => ({
    id: '0a1b2c3d-4e5f-6789-abcd-ef0123456789',
    name: 'Test User',
    email: 'test.user@gov.ab.ca',
    tenantId,
    isCore: false,
    roles: [],
    token: null,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    exp: Date.now() / 1000 + expiresIn,
    refreshExp: Date.now() / 1000 + 1800,
    authenticatedBy,
  });

  beforeAll(async () => {
    const upstreamApp = express();
    upstreamApp.use(express.json());
    upstreamApp.all('*', (req, res) => {
      upstreamRequests.push({ method: req.method, path: req.path, authorization: req.headers.authorization });
      res.json({ path: req.path });
    });
    upstream = upstreamApp.listen(0);
    await new Promise((resolve) => upstream.once('listening', resolve));
    upstreamUrl = new URL(`http://localhost:${(upstream.address() as AddressInfo).port}/api/`);
  });

  afterAll(async () => {
    await new Promise((resolve) => upstream.close(resolve));
  });

  function createApp(): Express {
    const configuration = new TokenHandlerConfiguration(
      new URL('https://access.adsp.alberta.ca'),
      loggerMock,
      directoryMock,
      repositoryMock,
      tenantId,
      {
        clients: {
          'my-client': {
            id: 'my-client',
            name: 'My client',
            targets: {
              'form-service': { id: 'form-service', upstream: 'urn:ads:platform:form-service' },
              'missing-service': { id: 'missing-service', upstream: 'urn:ads:my-tenant:missing-service' },
            },
          },
          'unregistered-client': {
            id: 'unregistered-client',
            name: 'Unregistered client',
            targets: { 'form-service': { id: 'form-service', upstream: 'urn:ads:platform:form-service' } },
          },
        },
      },
    );

    const passport = new Passport();
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user: Express.User, done) => done(null, user));

    const app = express();
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Signs in a user on the session and sets the CSRF token, as completing sign in does.
    app.get('/test/sign-in/:client', (req, res, next) =>
      req.login(sessionUser(req.params.client, Number(req.query.expiresIn ?? 300)), (err) => {
        req.session['csrfToken'] = csrfToken;
        return err ? next(err) : res.sendStatus(204);
      }),
    );

    app.use('/token-handler/v1', documented.middleware);
    app.use(
      '/token-handler/v1',
      createTargetRouter({
        // configurationHandler is an SDK handler; it provides the configuration of the tenant of the user.
        configurationHandler: (req, _res, next) => {
          req.getConfiguration = jest.fn().mockResolvedValue(configuration) as typeof req.getConfiguration;
          next();
        },
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  async function signIn(client = 'my-client', expiresIn = 300) {
    const agent = request.agent(createApp());
    await agent.get(`/test/sign-in/${client}?expiresIn=${expiresIn}`);
    return agent;
  }

  beforeEach(() => {
    upstreamRequests.length = 0;
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /token-handler/v1/targets/{targetId}/{targetPath}', () => {
    it('proxies the request with the access token of the user', async () => {
      const agent = await signIn();

      const res = await agent.get('/token-handler/v1/targets/form-service/forms?top=10');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ path: '/api/forms' });
      expect(upstreamRequests).toEqual([{ method: 'GET', path: '/api/forms', authorization: 'Bearer access-token' }]);
    });

    it('returns 400 for a target ID that is too long', async () => {
      const agent = await signIn();

      const res = await agent.get(`/token-handler/v1/targets/${'a'.repeat(51)}/forms`);

      expect(res.status).toBe(400);
    });

    it('returns 400 for a path with an encoded path separator', async () => {
      const agent = await signIn();

      const res = await agent.get('/token-handler/v1/targets/form-service/..%2Fsecrets');

      expect(res.status).toBe(400);
      expect(upstreamRequests).toHaveLength(0);
    });

    it('returns 400 when the upstream cannot be resolved', async () => {
      const agent = await signIn();

      const res = await agent.get('/token-handler/v1/targets/missing-service/forms');

      expect(res.status).toBe(400);
    });

    it('returns 401 when no user is signed in', async () => {
      const res = await request(createApp()).get('/token-handler/v1/targets/form-service/forms');

      expect(res.status).toBe(401);
    });

    it('returns 401 when the access token cannot be refreshed for a client that is not registered', async () => {
      const agent = await signIn('unregistered-client', 30);

      const res = await agent.get('/token-handler/v1/targets/form-service/forms');

      expect(res.status).toBe(401);
      expect(upstreamRequests).toHaveLength(0);
    });

    it('returns 404 for a target that is not a target of the client', async () => {
      const agent = await signIn();

      const res = await agent.get('/token-handler/v1/targets/file-service/files');

      expect(res.status).toBe(404);
    });
  });

  describe.each(['post', 'put', 'patch', 'delete'] as const)(
    '%s /token-handler/v1/targets/{targetId}/{targetPath}',
    (method) => {
      it('proxies the request with the CSRF token', async () => {
        const agent = await signIn();

        const res = await agent[method]('/token-handler/v1/targets/form-service/forms')
          .set('X-XSRF-TOKEN', csrfToken)
          .send({ definitionId: 'my-form-definition' });

        expect(res.status).toBe(200);
        expect(upstreamRequests).toEqual([
          expect.objectContaining({ method: method.toUpperCase(), path: '/api/forms' }),
        ]);
      });

      it('returns 400 without the CSRF token', async () => {
        const agent = await signIn();

        const res = await agent[method]('/token-handler/v1/targets/form-service/forms').send({});

        expect(res.status).toBe(400);
        expect(upstreamRequests).toHaveLength(0);
      });

      it('returns 401 when no user is signed in', async () => {
        const res = await request(createApp())[method]('/token-handler/v1/targets/form-service/forms');

        expect(res.status).toBe(401);
      });

      it('returns 404 for a target that is not a target of the client', async () => {
        const agent = await signIn();

        const res = await agent[method]('/token-handler/v1/targets/file-service/files').set('X-XSRF-TOKEN', csrfToken);

        expect(res.status).toBe(404);
      });
    },
  );
});
