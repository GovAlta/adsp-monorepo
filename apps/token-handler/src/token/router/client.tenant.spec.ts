import { adspId, Tenant } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import * as session from 'express-session';
import * as request from 'supertest';
import { Logger } from 'winston';

import { createClientRouter } from './client';

// Sign in is started and completed in separate requests that are tied together by the session cookie, so this uses
// the router with a real session instead of mocked requests.
describe('client router tenant of sign in', () => {
  const tenant: Tenant = { id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`, name: 'My Tenant', realm: 'r' };

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;

  // The client responds with the tenant of the request, instead of redirecting to access service.
  const clientMock = {
    authenticate: jest.fn(async (_passport, complete = false) => (req: express.Request, res: express.Response) => {
      res.json({ phase: complete ? 'complete' : 'initiate', tenant: req.tenant?.name });
    }),
  };

  const createApp = () => {
    const app = express();
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false, cookie: { secure: false } }));

    const configurationHandler: express.RequestHandler = (req, _res, next) => {
      Object.assign(req, {
        getConfiguration: async () => ({ getClient: (id: string) => (id === 'my-client' ? clientMock : null) }),
      });
      next();
    };
    const passportMock = { authenticate: () => (_req, _res, next) => next() };

    app.use(
      createClientRouter({
        configurationHandler,
        eventService: { send: jest.fn() },
        passport: passportMock as never,
        tenantHandler: (_req, _res, next) => next(),
        tenantService: tenantServiceMock,
      })
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  };

  beforeEach(() => {
    clientMock.authenticate.mockClear();
    tenantServiceMock.getTenantByName.mockReset();
    tenantServiceMock.getTenant.mockReset();
    tenantServiceMock.getTenantByName.mockImplementation(async (name: string) =>
      name.toLowerCase() === 'my tenant' ? tenant : null
    );
    tenantServiceMock.getTenant.mockImplementation(async () => tenant);
  });

  it('can complete sign in with the tenant provided when it was started', async () => {
    const agent = request.agent(createApp());

    const started = await agent.get('/clients/my-client/auth').query({ tenant: 'My Tenant' });
    expect(started.status).toBe(200);
    expect(started.body).toEqual({ phase: 'initiate', tenant: 'My Tenant' });

    // No header or query parameter; the tenant is kept in the session.
    const completed = await agent.get('/clients/my-client/callback');
    expect(completed.status).toBe(200);
    expect(completed.body).toEqual({ phase: 'complete', tenant: 'My Tenant' });
  });

  it('can complete sign in with the tenant provided by the header of the proxy', async () => {
    const agent = request.agent(createApp());

    const started = await agent.get('/clients/my-client/auth').set('X-Adsp-Tenant', 'My Tenant');
    expect(started.body).toEqual({ phase: 'initiate', tenant: 'My Tenant' });

    const completed = await agent.get('/clients/my-client/callback').set('X-Adsp-Tenant', 'My Tenant');
    expect(completed.body).toEqual({ phase: 'complete', tenant: 'My Tenant' });
  });

  it('can use the header of the proxy rather than the query parameter', async () => {
    const response = await request(createApp())
      .get('/clients/my-client/auth')
      .query({ tenant: 'Another Tenant' })
      .set('X-Adsp-Tenant', 'My Tenant');

    expect(response.body.tenant).toBe('My Tenant');
    expect(tenantServiceMock.getTenantByName).not.toHaveBeenCalledWith('Another Tenant');
  });

  it('can still use the kebab-case name in the header', async () => {
    const response = await request(createApp()).get('/clients/my-client/auth').set('X-Adsp-Tenant', 'my-tenant');

    expect(response.body.tenant).toBe('My Tenant');
  });

  it('can start sign in with an empty query parameter when the header of the proxy has the tenant', async () => {
    const response = await request(createApp())
      .get('/clients/my-client/auth?tenant=')
      .set('X-Adsp-Tenant', 'My Tenant');

    expect(response.status).toBe(200);
    expect(response.body.tenant).toBe('My Tenant');
  });

  it('does not start a session for a client that does not exist', async () => {
    const response = await request(createApp()).get('/clients/unknown/auth').query({ tenant: 'My Tenant' });

    expect(response.status).toBe(404);
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('cannot complete sign in on another session', async () => {
    const app = createApp();
    await request.agent(app).get('/clients/my-client/auth').query({ tenant: 'My Tenant' });

    // A different session does not have the tenant that was provided.
    const response = await request(app).get('/clients/my-client/callback');
    expect(response.status).toBe(400);
  });

  it('cannot complete sign in that was not started', async () => {
    const response = await request(createApp()).get('/clients/my-client/callback');

    expect(response.status).toBe(400);
    expect(clientMock.authenticate).not.toHaveBeenCalled();
  });

  it('does not take the tenant from the query parameter to complete sign in', async () => {
    const response = await request(createApp()).get('/clients/my-client/callback').query({ tenant: 'My Tenant' });

    expect(response.status).toBe(400);
  });

  it('cannot start sign in without a tenant', async () => {
    const response = await request(createApp()).get('/clients/my-client/auth');

    expect(response.status).toBe(400);
  });

  it('cannot start sign in for a tenant that does not exist', async () => {
    const response = await request(createApp()).get('/clients/my-client/auth').query({ tenant: 'Not A Tenant' });

    expect(response.status).toBe(404);
  });

  it('does not use a pattern as a tenant name', async () => {
    const response = await request(createApp()).get('/clients/my-client/auth').query({ tenant: '.*' });

    expect(response.status).toBe(404);
    expect(tenantServiceMock.getTenantByName).not.toHaveBeenCalled();
  });

  it.each(['tenant=a&tenant=b', 'tenant[x]=y', 'tenant='])('cannot start sign in with the query %s', async (query) => {
    const response = await request(createApp()).get(`/clients/my-client/auth?${query}`);

    expect(response.status).toBe(400);
    expect(tenantServiceMock.getTenantByName).not.toHaveBeenCalled();
  });

  it('does not require a tenant to sign out', async () => {
    // Sign out uses the user of the session and is not affected by the tenant of sign in.
    const response = await request(createApp()).get('/clients/my-client/logout');

    // There is no user to sign out; the response is not about a tenant.
    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).not.toContain('tenant');
  });
});
