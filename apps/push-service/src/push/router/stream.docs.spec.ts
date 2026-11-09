import { adspId, AdspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as compression from 'compression';
import * as express from 'express';
import { Express } from 'express';
import { get, IncomingMessage, Server } from 'http';
import { AddressInfo } from 'net';
import { join } from 'path';
import { Subject } from 'rxjs';
import * as request from 'supertest';
import { Logger } from 'winston';
import { StreamEntity } from '../model';
import { PushServiceRoles } from '../roles';
import { Stream } from '../types';
import { createStreamRouter } from './stream';

// Verifies the tenancy, access, and error responses documented in stream.swagger.yml by sending requests through the
// stream router as mounted in the service, with the real error handler.
describe('stream router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c8`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'stream.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const tenantServiceMock = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const subscriberServiceMock = (subject: Subject<unknown>) => ({
    getItems: jest.fn(() => subject.asObservable()),
    isConnected: jest.fn(),
  });

  const tenantUser = (roles: string[], userTenantId = tenantId) =>
    ({ id: 'tester', name: 'Test User', tenantId: userTenantId, isCore: false, roles }) as unknown as User;
  const coreUser = (roles: string[]) => ({ id: 'core', name: 'Core User', isCore: true, roles }) as unknown as User;

  const streamConfig = (id: string, publicSubscribe: boolean): Stream => ({
    id,
    name: `Stream ${id}`,
    description: null,
    publicSubscribe,
    subscriberRoles: ['health-reader'],
    events: [{ namespace: 'status-service', name: 'health-check-started' }],
  });
  // Mirrors combineConfiguration in main.ts: streams are entities scoped to the requested tenant (none for core).
  const configuration = (streamTenantId: AdspId) => ({
    'application-health': new StreamEntity(loggerMock, streamTenantId, streamConfig('application-health', false)),
    'public-updates': new StreamEntity(loggerMock, streamTenantId, streamConfig('public-updates', true)),
  });

  let events: Subject<unknown>;
  let server: Server;

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    // As in main.ts; server-sent events use the flush function that compression adds.
    app.use(compression());
    app.use((req, _res, next) => {
      // passport (core, jwt, anonymous) sets the user, and configurationHandler provides getConfiguration.
      req.user = currentUser;
      req.getConfiguration = jest.fn((requestedTenantId?: AdspId) =>
        Promise.resolve(configuration(requestedTenantId || currentUser?.tenantId)),
      ) as typeof req.getConfiguration;
      next();
    });
    app.use(
      '/stream/v1',
      createStreamRouter([], {
        logger: loggerMock,
        eventServiceAmp: subscriberServiceMock(events) as never,
        eventServiceAmpWebhooks: subscriberServiceMock(new Subject()) as never,
        tenantService: tenantServiceMock,
        tokenProvider: { getAccessToken: jest.fn() },
        eventService: { send: jest.fn() },
        configurationService: {
          getConfiguration: jest.fn(),
          getServiceConfiguration: jest.fn(),
          getServiceConfigurationRevision: jest.fn(),
        },
        serviceId: adspId`urn:ads:platform:push-service`,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  // Server-sent event responses stay open, so read the status and the first event and then disconnect.
  async function subscribe(app: Express, path: string, onOpen?: () => void) {
    server = app.listen(0);
    const { port } = server.address() as AddressInfo;
    const response = await new Promise<IncomingMessage>((resolve, reject) =>
      get(`http://localhost:${port}${path}`, resolve).on('error', reject),
    );
    const firstData = response.headers['content-type']?.startsWith('text/event-stream')
      ? new Promise<string>((resolve) => response.once('data', (chunk) => resolve(`${chunk}`)))
      : null;
    onOpen?.();
    const data = await firstData;
    response.destroy();
    return { status: response.statusCode, contentType: response.headers['content-type'], data };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    events = new Subject();
  });

  afterEach(async () => {
    server?.close();
    server = null;
    await documented.assertDocumented();
  });

  describe('GET /stream/v1/streams', () => {
    it('lists the streams of the token tenant that a stream-listener can subscribe to', async () => {
      const res = await request(createApp(tenantUser([PushServiceRoles.StreamListener]))).get('/stream/v1/streams');

      expect(res.status).toBe(200);
      expect(Object.keys(res.body)).toEqual(['application-health', 'public-updates']);
      expect(res.body['application-health']).toEqual(streamConfig('application-health', false));
    });

    it('lists only public streams for a user without a subscriber role', async () => {
      const res = await request(createApp(tenantUser([]))).get('/stream/v1/streams');

      expect(res.status).toBe(200);
      expect(Object.keys(res.body)).toEqual(['public-updates']);
    });

    it('lists public streams of the tenant parameter for an anonymous caller', async () => {
      const res = await request(createApp(null))
        .get('/stream/v1/streams')
        .query({ tenant: '61f2e3a8c9b1d2e3f4a5b6c8' });

      expect(res.status).toBe(200);
      expect(Object.keys(res.body)).toEqual(['public-updates']);
    });

    it('lists streams of the tenant parameter for a core user with a subscriber role', async () => {
      const res = await request(createApp(coreUser(['health-reader'])))
        .get('/stream/v1/streams')
        .query({ tenant: '61f2e3a8c9b1d2e3f4a5b6c7' });

      expect(res.status).toBe(200);
      expect(Object.keys(res.body)).toEqual(['application-health', 'public-updates']);
    });

    it('returns 400 for an anonymous caller without a tenant', async () => {
      const res = await request(createApp(null)).get('/stream/v1/streams');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ errorMessage: 'No tenant specified for request.' });
    });

    it('returns 400 for a core user without a tenant', async () => {
      const res = await request(createApp(coreUser([PushServiceRoles.StreamListener]))).get('/stream/v1/streams');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /stream/v1/streams/{stream}', () => {
    const event = {
      tenantId,
      namespace: 'status-service',
      name: 'health-check-started',
      timestamp: new Date('2026-10-01T15:04:05.000Z'),
      correlationId: '64b1f2e3a8c9b1d2e3f4a5b6',
      context: { applicationId: '64b1f2e3a8c9b1d2e3f4a5b6' },
      payload: {},
    };

    it('sends matching events as server-sent events to a user with a subscriber role', async () => {
      const res = await subscribe(
        createApp(tenantUser(['health-reader'])),
        '/stream/v1/streams/application-health',
        () => events.next({ item: event, done: jest.fn() }),
      );

      expect(res.status).toBe(200);
      expect(res.contentType).toMatch(/^text\/event-stream/);
      expect(JSON.parse(res.data.replace(/^data: /, ''))).toEqual(
        expect.objectContaining({ tenantId: tenantId.toString(), namespace: 'status-service' }),
      );
    });

    it('subscribes an anonymous caller to a public stream of the named tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: otherTenantId, name: 'My Tenant' });

      const res = await subscribe(createApp(null), '/stream/v1/streams/public-updates?tenant=my-tenant', () =>
        events.next({ item: { ...event, tenantId: otherTenantId }, done: jest.fn() }),
      );

      expect(res.status).toBe(200);
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('my tenant');
      expect(JSON.parse(res.data.replace(/^data: /, ''))).toEqual(
        expect.objectContaining({ tenantId: otherTenantId.toString() }),
      );
    });

    it('subscribes a core stream-listener without a tenant to a cross-tenant stream', async () => {
      const res = await subscribe(
        createApp(coreUser([PushServiceRoles.StreamListener])),
        '/stream/v1/streams/application-health',
        () => events.next({ item: { ...event, tenantId: otherTenantId }, done: jest.fn() }),
      );

      expect(res.status).toBe(200);
      expect(JSON.parse(res.data.replace(/^data: /, ''))).toEqual(
        expect.objectContaining({ tenantId: otherTenantId.toString() }),
      );
    });

    it('applies the criteria parameter', async () => {
      const criteria = encodeURIComponent(JSON.stringify({ correlationId: 'application-1234' }));
      const res = await subscribe(
        createApp(tenantUser([PushServiceRoles.StreamListener])),
        `/stream/v1/streams/application-health?criteria=${criteria}`,
        () => {
          events.next({ item: event, done: jest.fn() });
          events.next({ item: { ...event, correlationId: 'application-1234' }, done: jest.fn() });
        },
      );

      expect(res.status).toBe(200);
      expect(JSON.parse(res.data.replace(/^data: /, ''))).toEqual(
        expect.objectContaining({ correlationId: 'application-1234' }),
      );
    });

    it('returns 400 for an anonymous caller without a tenant', async () => {
      const res = await request(createApp(null)).get('/stream/v1/streams/public-updates');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ errorMessage: 'No tenant specified for request.' });
    });

    it('returns 400 for an anonymous caller when the tenant parameter matches no tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(null)).get('/stream/v1/streams/public-updates').query({ tenant: 'unknown' });

      expect(res.status).toBe(400);
    });

    it('returns 404 for a stream that is not configured', async () => {
      const res = await request(createApp(tenantUser([PushServiceRoles.StreamListener]))).get(
        '/stream/v1/streams/application-updates',
      );

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMessage: "stream with ID 'application-updates' could not be found." });
    });
  });
});
