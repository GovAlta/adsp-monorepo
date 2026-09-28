import { adspId, User } from '@abgov/adsp-service-sdk';
import { AjvValidationService, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { NamespaceEntity } from '../model';
import { EventServiceRoles } from '../role';
import { DomainEventService } from '../service';
import { createEventRouter } from './event';

// Verifies the request validation, roles, and error responses documented in event.swagger.yml by sending
// requests through the router with the real error handler.
describe('event router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/other`;

  const documented = createDocumentedResponseRecorder(join(__dirname, 'event.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const eventServiceMock = { send: jest.fn() };

  const namespace = new NamespaceEntity(new AjvValidationService(loggerMock), {
    name: 'application-events',
    definitions: {
      'user-registration': {
        name: 'user-registration',
        description: null,
        payloadSchema: {
          type: 'object',
          properties: { userId: { type: 'string' } },
          required: ['userId'],
        },
      },
    },
  });

  const user = (roles: string[], overrides: Partial<User> = {}) =>
    ({ id: 'tester', name: 'Tester', tenantId, isCore: false, roles, ...overrides }) as User;
  const sender = user([EventServiceRoles.sender]);

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.getConfiguration = jest.fn().mockResolvedValue({ 'application-events': namespace });
      next();
    });
    app.use(
      '/event/v1',
      createEventRouter({ logger: loggerMock, eventService: eventServiceMock as unknown as DomainEventService }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  const validEvent = () => ({
    namespace: 'application-events',
    name: 'user-registration',
    correlationId: 'Bobs-user-id',
    context: { applicationId: 'application-1234' },
    timestamp: '2026-09-24T17:00:00.000Z',
    payload: { userId: 'Bobs-user-id', registeredOn: '2026-09-24' },
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the documented example event', async () => {
    const res = await request(createApp(sender)).post('/event/v1/events').send(validEvent());
    expect(res.status).toBe(200);
    expect(eventServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: 'application-events', name: 'user-registration', tenantId }),
    );
  });

  it('sends an ad hoc event without a definition and does not validate its payload', async () => {
    const res = await request(createApp(sender))
      .post('/event/v1/events')
      .send({ ...validEvent(), namespace: 'ad-hoc', name: 'anything', payload: { unexpected: true } });
    expect(res.status).toBe(200);
    expect(eventServiceMock.send).toHaveBeenCalled();
  });

  it('accepts null correlationId and context', async () => {
    const res = await request(createApp(sender))
      .post('/event/v1/events')
      .send({ ...validEvent(), correlationId: null, context: null });
    expect(res.status).toBe(200);
  });

  it('responds 400 when the payload does not match the definition schema', async () => {
    const res = await request(createApp(sender))
      .post('/event/v1/events')
      .send({ ...validEvent(), payload: { registeredOn: '2026-09-24' } });
    expect(res.status).toBe(400);
    expect(res.body.errorMessage).toBeTruthy();
    expect(eventServiceMock.send).not.toHaveBeenCalled();
  });

  it.each([
    ['namespace is missing', { namespace: undefined }],
    ['name is missing', { name: undefined }],
    ['namespace is longer than 50 characters', { namespace: 'a'.repeat(51) }],
    ['name is longer than 50 characters', { name: 'a'.repeat(51) }],
    ['namespace is empty', { namespace: '' }],
    ['timestamp is missing', { timestamp: undefined }],
    ['timestamp is not ISO 8601', { timestamp: 'yesterday' }],
    ['payload is missing', { payload: undefined }],
    ['context is not an object', { context: 'text' }],
  ])('responds 400 when %s', async (_case, change) => {
    const res = await request(createApp(sender))
      .post('/event/v1/events')
      .send({ ...validEvent(), ...change });
    expect(res.status).toBe(400);
    expect(res.body.errorMessage).toMatch(/^Validation failed with error\(s\)/);
    expect(eventServiceMock.send).not.toHaveBeenCalled();
  });

  it('responds with the documented error message for an invalid timestamp', async () => {
    const res = await request(createApp(sender))
      .post('/event/v1/events')
      .send({ ...validEvent(), timestamp: 'yesterday' });
    expect(res.body).toEqual({ errorMessage: 'Validation failed with error(s): timestamp (body) - Invalid value' });
  });

  it('responds 400 when there is no tenant context', async () => {
    const coreSender = user([EventServiceRoles.sender], { isCore: true, tenantId: undefined });
    const res = await request(createApp(coreSender)).post('/event/v1/events').send(validEvent());
    expect(res.status).toBe(400);
  });

  it('responds 401 when there is no authenticated user', async () => {
    const res = await request(createApp(null)).post('/event/v1/events').send(validEvent());
    expect(res.status).toBe(401);
  });

  it('responds 403 without the event-sender role', async () => {
    const res = await request(createApp(user([])))
      .post('/event/v1/events')
      .send(validEvent());
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ errorMessage: 'User Tester (ID: tester) not permitted to send event.' });
  });

  it('responds 403 when a tenant user sends an event for another tenant', async () => {
    const res = await request(createApp(sender))
      .post('/event/v1/events')
      .send({ ...validEvent(), tenantId: otherTenantId.toString() });
    expect(res.status).toBe(403);
    expect(eventServiceMock.send).not.toHaveBeenCalled();
  });

  it('allows a core user to send an event for a tenant specified in the body', async () => {
    const coreSender = user([EventServiceRoles.sender], { isCore: true, tenantId: undefined });
    const res = await request(createApp(coreSender))
      .post('/event/v1/events')
      .send({ ...validEvent(), tenantId: otherTenantId.toString() });
    expect(res.status).toBe(200);
    expect(eventServiceMock.send.mock.calls[0][0].tenantId.toString()).toBe(otherTenantId.toString());
  });
});
