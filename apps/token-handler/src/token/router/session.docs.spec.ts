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

import { UserSessionData } from '../types';
import { createSessionRouter } from './session';

// Bearer tokens are resolved by the tenant strategy of the SDK; no bearer token is accepted here.
class TestTenantStrategy extends Strategy {
  authenticate() {
    this.fail(401);
  }
}

// Verifies the responses documented in session.swagger.yml by sending requests through the session router as mounted
// in the service, with the real error handler.
describe('session router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
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
    passport.use('tenant', new TestTenantStrategy());
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
    app.use('/token-handler/v1', createSessionRouter({ passport: passport as never, sessionStore }));
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

    it('returns 401 when no user is signed in', async () => {
      const res = await request(createApp()).get('/token-handler/v1/sessions');

      expect(res.status).toBe(401);
    });
  });
});
