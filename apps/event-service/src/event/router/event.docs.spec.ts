import { AdspId, adspId, User } from '@abgov/adsp-service-sdk';
import { AjvValidationService, ConfigurationClient, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { NamespaceEntity } from '../model';
import { EventServiceConfigurationRoles, EventServiceRoles } from '../role';
import { DomainEventService } from '../service';
import { countEvents } from '../valueServiceClient';
import { createDefinitionRouter, EventConfiguration } from './definition';
import { createEventRouter } from './event';

jest.mock('../valueServiceClient');

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
  const reader = user([EventServiceRoles.reader]);

  const directoryMock = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() };
  const tokenProviderMock = { getAccessToken: jest.fn() };
  const countEventsMock = countEvents as jest.Mock;

  const configurationClientMock = {
    getTenantConfiguration: jest.fn(),
    getCoreConfiguration: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
  };

  // Mirrors the SDK tenant handler: core users act on the tenantId query parameter, other users on their token's tenant.
  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      const tenantIdValue = req.query.tenantId as string;
      const contextTenantId = currentUser?.isCore
        ? tenantIdValue
          ? AdspId.parse(tenantIdValue)
          : undefined
        : currentUser?.tenantId;
      req.tenant = contextTenantId ? ({ id: contextTenantId } as typeof req.tenant) : undefined;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.getConfiguration = jest.fn().mockResolvedValue({ 'application-events': namespace });
      next();
    });
    app.use(
      '/event/v1',
      createEventRouter({
        logger: loggerMock,
        eventService: eventServiceMock as unknown as DomainEventService,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      }),
    );
    app.use(
      '/event/v1',
      createDefinitionRouter({
        client: configurationClientMock as unknown as ConfigurationClient<EventConfiguration>,
        validationService: new AjvValidationService(loggerMock),
      }),
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
    Object.values(configurationClientMock).forEach((mock) => mock.mockReset());
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

  it('ignores the body tenantId of a tenant user and sends in the token tenant', async () => {
    const res = await request(createApp(sender))
      .post('/event/v1/events')
      .send({ ...validEvent(), tenantId: otherTenantId.toString() });
    expect(res.status).toBe(200);
    expect(eventServiceMock.send.mock.calls[0][0].tenantId.toString()).toBe(tenantId.toString());
  });

  it('allows a core user to send an event for a tenant specified in the query', async () => {
    const coreSender = user([EventServiceRoles.sender], { isCore: true, tenantId: undefined });
    const res = await request(createApp(coreSender))
      .post(`/event/v1/events?tenantId=${otherTenantId}`)
      .send(validEvent());
    expect(res.status).toBe(200);
    expect(eventServiceMock.send.mock.calls[0][0].tenantId.toString()).toBe(otherTenantId.toString());
  });

  it('responds 400 when a core user sends a body tenantId that is not a URN', async () => {
    const coreSender = user([EventServiceRoles.sender], { isCore: true, tenantId: undefined });
    const res = await request(createApp(coreSender))
      .post('/event/v1/events')
      .send({ ...validEvent(), tenantId: 'test' });
    expect(res.status).toBe(400);
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

  describe('GET /event/v1/events/count', () => {
    it('responds with the documented example count', async () => {
      countEventsMock.mockResolvedValueOnce(1024);
      const res = await request(createApp(reader)).get(
        `/event/v1/events/count?context=${JSON.stringify({ namespace: 'application-events', name: 'user-registration' })}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ count: 1024 });
    });

    it('counts events without context, timestamps, or correlationId', async () => {
      countEventsMock.mockResolvedValueOnce(5);
      const res = await request(createApp(reader)).get('/event/v1/events/count');
      expect(res.status).toBe(200);
      expect(countEventsMock).toHaveBeenCalledWith(
        directoryMock,
        tokenProviderMock,
        tenantId,
        expect.objectContaining({ context: null, correlationId: undefined }),
      );
    });

    it.each([
      ['namespace', 'application-events'],
      ['name', 'user-registration'],
    ])('counts events with the optional %s filter', async (parameter, value) => {
      countEventsMock.mockResolvedValueOnce(3);

      const res = await request(createApp(reader)).get(`/event/v1/events/count?${parameter}=${value}`);

      expect(res.status).toBe(200);
      expect(countEventsMock).toHaveBeenCalledWith(
        directoryMock,
        tokenProviderMock,
        tenantId,
        expect.objectContaining({ [parameter]: value }),
      );
    });

    it.each(['namespace', 'name'])('responds 400 when %s is empty', async (parameter) => {
      const res = await request(createApp(reader)).get(`/event/v1/events/count?${parameter}=`);

      expect(res.status).toBe(400);
      expect(countEventsMock).not.toHaveBeenCalled();
    });

    it('responds 400 when context is not valid JSON', async () => {
      const res = await request(createApp(reader)).get('/event/v1/events/count?context=not-json');
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toMatch(/^Validation failed with error\(s\)/);
      expect(countEventsMock).not.toHaveBeenCalled();
    });

    it('responds with the documented error message for an invalid timestampMin', async () => {
      const res = await request(createApp(reader)).get('/event/v1/events/count?timestampMin=yesterday');
      expect(res.body).toEqual({
        errorMessage: 'Validation failed with error(s): timestampMin (query) - Invalid value',
      });
    });

    it('responds 400 when there is no tenant context', async () => {
      const coreReader = user([EventServiceRoles.reader], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreReader)).get('/event/v1/events/count');
      expect(res.status).toBe(400);
    });

    it('responds 401 when there is no authenticated user', async () => {
      const res = await request(createApp(null)).get('/event/v1/events/count');
      expect(res.status).toBe(401);
    });

    it('responds 403 without the event-reader role', async () => {
      const res = await request(createApp(user([]))).get('/event/v1/events/count');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ errorMessage: 'User Tester (ID: tester) not permitted to count events.' });
    });
  });

  describe('event definitions', () => {
    const admin = user([EventServiceRoles.admin]);
    const configurationReader = user([EventServiceConfigurationRoles.Reader]);
    const coreAdmin = user([EventServiceRoles.admin], { isCore: true, tenantId: undefined });

    const definition = {
      name: 'user-registration',
      description: 'A new user registered.',
      payloadSchema: { type: 'object', properties: { userId: { type: 'string' } }, required: ['userId'] },
    };
    const tenantConfiguration = (): EventConfiguration => ({
      'application-events': { name: 'application-events', definitions: { 'user-registration': definition } },
    });
    const coreConfiguration = (): EventConfiguration => ({
      'form-service': {
        name: 'form-service',
        definitions: { 'form-submitted': { name: 'form-submitted', description: null, payloadSchema: {} } },
      },
    });
    const definitionPath = '/event/v1/definitions/application-events/user-registration';

    beforeEach(() => {
      configurationClientMock.getTenantConfiguration.mockResolvedValue(tenantConfiguration());
      configurationClientMock.getCoreConfiguration.mockResolvedValue(coreConfiguration());
      configurationClientMock.updateEntry.mockImplementation(async (_tenantId, key, value) => ({ [key]: value }));
      configurationClientMock.deleteEntry.mockResolvedValue({});
    });

    describe('GET /event/v1/definitions', () => {
      it('responds with tenant then core definitions', async () => {
        const res = await request(createApp(configurationReader)).get('/event/v1/definitions');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
          { ...definition, namespace: 'application-events', isCore: false },
          expect.objectContaining({ namespace: 'form-service', name: 'form-submitted', isCore: true }),
        ]);
      });

      it('responds with only core definitions for a core user without tenantId', async () => {
        const res = await request(createApp(coreAdmin)).get('/event/v1/definitions');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(configurationClientMock.getTenantConfiguration).not.toHaveBeenCalled();
      });

      it('includes the tenant definitions for a core user with tenantId', async () => {
        const res = await request(createApp(coreAdmin)).get(`/event/v1/definitions?tenantId=${tenantId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
      });

      it('responds 401 when there is no authenticated user', async () => {
        const res = await request(createApp(null)).get('/event/v1/definitions');
        expect(res.status).toBe(401);
      });

      it('responds 403 without the event-admin or configuration-reader role', async () => {
        const res = await request(createApp(sender)).get('/event/v1/definitions');
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ errorMessage: 'User Tester (ID: tester) not permitted to find event definitions.' });
      });
    });

    describe('GET /event/v1/definitions/{namespace}/{name}', () => {
      it('responds with the tenant definition', async () => {
        const res = await request(createApp(admin)).get(definitionPath);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ...definition, namespace: 'application-events', isCore: false });
      });

      it('responds with a core definition', async () => {
        const res = await request(createApp(configurationReader)).get(
          '/event/v1/definitions/form-service/form-submitted',
        );
        expect(res.status).toBe(200);
        expect(res.body.isCore).toBe(true);
      });

      it('responds 400 when namespace does not match the pattern', async () => {
        const res = await request(createApp(admin)).get('/event/v1/definitions/bad!namespace/user-registration');
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          errorMessage: 'Validation failed with error(s): namespace (params) - Invalid value',
        });
      });

      it('responds 401 when there is no authenticated user', async () => {
        const res = await request(createApp(null)).get(definitionPath);
        expect(res.status).toBe(401);
      });

      it('responds 403 without the event-admin or configuration-reader role', async () => {
        const res = await request(createApp(sender)).get(definitionPath);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ errorMessage: 'User Tester (ID: tester) not permitted to find event definition.' });
      });

      it('responds 404 when the definition does not exist', async () => {
        const res = await request(createApp(admin)).get('/event/v1/definitions/application-events/missing');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({
          errorMessage: "event definition with ID 'application-events:missing' could not be found.",
        });
      });
    });

    describe('POST /event/v1/definitions', () => {
      const newDefinition = () => ({
        namespace: 'application-events',
        name: 'user-deleted',
        description: 'A user was deleted.',
        payloadSchema: { type: 'object', properties: { userId: { type: 'string' } } },
      });

      it('creates the documented example definition', async () => {
        configurationClientMock.getTenantConfiguration.mockResolvedValueOnce({});
        const res = await request(createApp(admin))
          .post('/event/v1/definitions')
          .send({ ...definition, namespace: 'application-events' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ...definition, namespace: 'application-events', isCore: false });
        expect(configurationClientMock.updateEntry).toHaveBeenCalledWith(
          tenantId,
          'application-events',
          expect.objectContaining({ definitions: { 'user-registration': definition } }),
        );
      });

      it('creates a definition in the tenant of a core user with tenantId', async () => {
        const res = await request(createApp(coreAdmin))
          .post(`/event/v1/definitions?tenantId=${otherTenantId}`)
          .send(newDefinition());
        expect(res.status).toBe(200);
        expect(configurationClientMock.updateEntry.mock.calls[0][0].toString()).toBe(otherTenantId.toString());
      });

      it.each([
        ['name does not match the pattern', { name: 'bad!name' }],
        ['payloadSchema is missing', { payloadSchema: undefined }],
        ['payloadSchema is not a valid JSON schema', { payloadSchema: { type: 'not-a-type' } }],
      ])('responds 400 when %s', async (_case, change) => {
        const res = await request(createApp(admin))
          .post('/event/v1/definitions')
          .send({ ...newDefinition(), ...change });
        expect(res.status).toBe(400);
        expect(configurationClientMock.updateEntry).not.toHaveBeenCalled();
      });

      it('responds with the documented error message for an invalid JSON schema', async () => {
        const res = await request(createApp(admin))
          .post('/event/v1/definitions')
          .send({ ...newDefinition(), name: 'user-registration', payloadSchema: { type: 'not-a-type' } });
        expect(res.body.errorMessage).toMatch(
          /^Event definition 'application-events:user-registration' has an invalid JSON schema: /,
        );
      });

      it('responds 400 for a core user without tenantId', async () => {
        const res = await request(createApp(coreAdmin)).post('/event/v1/definitions').send(newDefinition());
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ errorMessage: 'Tenant context is required for operation.' });
      });

      it('responds 401 when there is no authenticated user', async () => {
        const res = await request(createApp(null)).post('/event/v1/definitions').send(newDefinition());
        expect(res.status).toBe(401);
      });

      it('responds 403 without the event-admin role', async () => {
        const res = await request(createApp(configurationReader)).post('/event/v1/definitions').send(newDefinition());
        expect(res.status).toBe(403);
      });

      it('responds 409 when the definition already exists', async () => {
        const res = await request(createApp(admin))
          .post('/event/v1/definitions')
          .send({ ...newDefinition(), name: 'user-registration' });
        expect(res.status).toBe(409);
        expect(res.body).toEqual({
          errorMessage: "Event definition 'application-events:user-registration' already exists.",
        });
      });
    });

    describe('PATCH /event/v1/definitions/{namespace}/{name}', () => {
      const update = () => ({
        description: 'A new user registered.',
        payloadSchema: {
          type: 'object',
          properties: { userId: { type: 'string' }, email: { type: 'string' } },
          required: ['userId'],
        },
      });

      it('updates the documented example definition', async () => {
        const res = await request(createApp(admin)).patch(definitionPath).send(update());
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          ...update(),
          name: 'user-registration',
          namespace: 'application-events',
          isCore: false,
        });
      });

      it.each([
        ['name does not match the pattern', '/event/v1/definitions/application-events/bad!name', update()],
        ['payloadSchema is not an object', definitionPath, { ...update(), payloadSchema: 'text' }],
        ['payloadSchema is not a valid JSON schema', definitionPath, { ...update(), payloadSchema: { type: 1 } }],
      ])('responds 400 when %s', async (_case, path, body) => {
        const res = await request(createApp(admin)).patch(path).send(body);
        expect(res.status).toBe(400);
        expect(configurationClientMock.updateEntry).not.toHaveBeenCalled();
      });

      it('responds with the documented error message for a payloadSchema that is not an object', async () => {
        const res = await request(createApp(admin))
          .patch(definitionPath)
          .send({ ...update(), payloadSchema: 'text' });
        expect(res.body).toEqual({
          errorMessage: 'Validation failed with error(s): payloadSchema (body) - Invalid value',
        });
      });

      it('responds 400 for a core user without tenantId', async () => {
        const res = await request(createApp(coreAdmin)).patch(definitionPath).send(update());
        expect(res.status).toBe(400);
      });

      it('responds 401 when there is no authenticated user', async () => {
        const res = await request(createApp(null)).patch(definitionPath).send(update());
        expect(res.status).toBe(401);
      });

      it('responds 403 without the event-admin role', async () => {
        const res = await request(createApp(configurationReader)).patch(definitionPath).send(update());
        expect(res.status).toBe(403);
      });

      it('responds 404 for a core definition', async () => {
        const res = await request(createApp(admin))
          .patch('/event/v1/definitions/form-service/form-submitted')
          .send(update());
        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /event/v1/definitions/{namespace}/{name}', () => {
      it('deletes the definition and its now empty namespace', async () => {
        const res = await request(createApp(admin)).delete(definitionPath);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ deleted: true });
        expect(configurationClientMock.deleteEntry).toHaveBeenCalledWith(tenantId, 'application-events');
      });

      it('keeps the namespace when other definitions remain', async () => {
        configurationClientMock.getTenantConfiguration.mockResolvedValueOnce({
          'application-events': {
            name: 'application-events',
            definitions: { 'user-registration': definition, 'user-deleted': { ...definition, name: 'user-deleted' } },
          },
        });
        const res = await request(createApp(admin)).delete(definitionPath);
        expect(res.status).toBe(200);
        expect(configurationClientMock.updateEntry).toHaveBeenCalled();
        expect(configurationClientMock.deleteEntry).not.toHaveBeenCalled();
      });

      it('responds 400 when namespace does not match the pattern', async () => {
        const res = await request(createApp(admin)).delete('/event/v1/definitions/bad!namespace/user-registration');
        expect(res.status).toBe(400);
      });

      it('responds 400 for a core user without tenantId', async () => {
        const res = await request(createApp(coreAdmin)).delete(definitionPath);
        expect(res.status).toBe(400);
      });

      it('responds 401 when there is no authenticated user', async () => {
        const res = await request(createApp(null)).delete(definitionPath);
        expect(res.status).toBe(401);
      });

      it('responds 403 without the event-admin role', async () => {
        const res = await request(createApp(configurationReader)).delete(definitionPath);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({
          errorMessage: 'User Tester (ID: tester) not permitted to delete event definition.',
        });
      });

      it('responds 404 when the definition does not exist', async () => {
        const res = await request(createApp(admin)).delete('/event/v1/definitions/application-events/missing');
        expect(res.status).toBe(404);
      });
    });
  });
});
