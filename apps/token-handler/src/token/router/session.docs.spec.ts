import { AdspId, adspId } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import * as session from 'express-session';
import { Passport, Strategy } from 'passport';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';

import { ServiceRoles } from '../roles';
import { UserSessionData } from '../types';
import { createSessionRouter } from './session';

// Stands in for the tenant strategy of the SDK: accepts 'Bearer user-token' as a user and 'Bearer admin-token' as a
// token-handler-admin of the tenant.
class TestTenantStrategy extends Strategy {
  constructor(private readonly tenantId: AdspId) {
    super();
  }

  authenticate(req: express.Request) {
    if (req.headers.authorization === 'Bearer user-token') {
      this.success({ id: 'user', name: 'User', email: 'user@gov.ab.ca', tenantId: this.tenantId, isCore: false, roles: [], token: null });
    } else if (req.headers.authorization === 'Bearer admin-token') {
      this.success({
        id: 'admin',
        name: 'Admin',
        email: 'admin@gov.ab.ca',
        tenantId: this.tenantId,
        isCore: false,
        roles: [ServiceRoles.Admin],
        token: null,
      });
    } else {
      this.fail(401);
    }
  }
}

// Verifies the responses documented in session.swagger.yml by sending requests through the session router as mounted
// in the service, with the real error handler.
describe('session router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
  const serviceId = adspId`urn:ads:platform:token-handler`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'session.swagger.yml'));
  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;

  const sessionUser: UserSessionData = {
    id: '0a1b2c3d-4e5f-6789-abcd-ef0123456789',
    name: 'Test User',
    email: 'test.user@gov.ab.ca',
    tenantId,
    isCore: false,
    roles: ['urn:ads:platform:form-service:form-applicant'],
    token: null,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    exp: Date.now() / 1000 + 300,
    refreshExp: Date.now() / 1000 + 1800,
    authenticatedBy: 'my-client',
  };

  function createApp(): Express {
    const passport = new Passport();
    passport.use('tenant', new TestTenantStrategy(tenantId));
    // The tenant ID is serialized to the session as a string, as in configurePassport.
    passport.serializeUser((user, done) => done(null, { ...user, tenantId: user.tenantId.toString() }));
    passport.deserializeUser((user: Record<string, unknown>, done) =>
      done(null, { ...user, tenantId: AdspId.parse(user.tenantId as string) } as UserSessionData),
    );
    const sessionStore = new session.MemoryStore();

    const app = express();
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false, store: sessionStore }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Signs in a user on the session, as completing sign in does.
    app.get('/test/sign-in', (req, res, next) =>
      req.login(sessionUser, (err) => (err ? next(err) : res.sendStatus(204))),
    );

    app.use('/token-handler/v1', documented.middleware);
    app.use('/token-handler/v1', createSessionRouter({ passport: passport as never, serviceId, sessionStore }));
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /token-handler/v1/sessions', () => {
    it('returns the session of the signed in user', async () => {
      const agent = request.agent(createApp());
      await agent.get('/test/sign-in');

      const res = await agent.get('/token-handler/v1/sessions');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({
          tenantId: tenantId.toString(),
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
          roles: sessionUser.roles,
          authenticatedBy: 'my-client',
          expiry: expect.any(String),
        }),
      ]);
    });

    it('accepts a bearer token and lists the sessions of the tenant for token-handler-admin', async () => {
      const app = createApp();
      await request.agent(app).get('/test/sign-in');

      const res = await request(app).get('/token-handler/v1/sessions').set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ tenantId: tenantId.toString(), id: sessionUser.id })]);
    });

    it('returns no sessions for a bearer token without the admin role or a session cookie', async () => {
      const res = await request(createApp()).get('/token-handler/v1/sessions').set('Authorization', 'Bearer user-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 401 for an invalid bearer token', async () => {
      const res = await request(createApp()).get('/token-handler/v1/sessions').set('Authorization', 'Bearer bad');

      expect(res.status).toBe(401);
    });

    it('returns 401 when no user is signed in', async () => {
      const res = await request(createApp()).get('/token-handler/v1/sessions');

      expect(res.status).toBe(401);
    });
  });
});
