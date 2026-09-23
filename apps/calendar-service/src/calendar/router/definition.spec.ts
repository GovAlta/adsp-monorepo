import {
  adspId,
  AdspId,
  ConfigurationService,
  EventService,
  ServiceDirectory,
  TenantService,
  TokenProvider,
  User,
} from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import axios from 'axios';
import * as express from 'express';
import { Logger } from 'winston';
import { CalendarRepository } from '../repository';
import { CalendarServiceRoles } from '../roles';
import { CalendarDefinition } from '../types';
import { createCalendarRouter } from './calendar';

jest.mock('axios');

const axiosMock = axios as jest.Mocked<typeof axios>;
const serviceId = adspId`urn:ads:platform:calendar-service`;
const apiId = adspId`urn:ads:platform:calendar-service:v1`;
const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/service-delivery`;
const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/another-ministry`;
const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;
const configurationUrl = 'https://configuration.service.test/v2/configuration/platform/calendar-service';
const collectionPath = '/calendar/v1/calendars';
const definition: CalendarDefinition = {
  name: 'public-meetings',
  displayName: 'Public Meetings',
  description: 'Public engagement meeting schedule',
  readRoles: ['calendar-reader'],
  updateRoles: ['calendar-editor'],
};
const adminUser: User = {
  id: 'calendar-administrator',
  name: 'Calendar Administrator',
  email: 'calendar.admin@gov.ab.ca',
  tenantId,
  isCore: false,
  roles: [CalendarServiceRoles.Admin],
  token: {
    azp: 'calendar-admin-portal',
    aud: 'calendar-service',
    iss: 'https://access.service.test',
    bearer: 'end-user-access-token',
    email_verified: true,
  },
};

const directoryMock = { getServiceUrl: jest.fn() };
const tokenProviderMock = { getAccessToken: jest.fn() };
const configurationServiceMock = { clearCached: jest.fn() };
const eventServiceMock = { send: jest.fn() };
const repositoryMock = { getCalendarEvents: jest.fn() };
const loggerMock = { warn: jest.fn() };

interface RouteResponse {
  status: number;
  body: unknown;
  text: string;
}

// Exercise the real Express router and validators without opening a listening socket.
function dispatch(router: express.Router, method: string, url: string, body?: unknown): Promise<RouteResponse> {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url,
      originalUrl: url,
      headers: {},
      body,
      query: {},
      params: {},
      cookies: {},
    } as unknown as express.Request;
    const res = {
      statusCode: 200,
      headersSent: false,
      status(status: number) {
        this.statusCode = status;
        return this;
      },
      send(data?: unknown) {
        resolve({ status: this.statusCode, body: data, text: String(data ?? '') });
        return this;
      },
      json(data: unknown) {
        return this.send(data);
      },
      sendStatus(status: number) {
        this.statusCode = status;
        return this.send();
      },
    } as unknown as express.Response;
    router(req, res, (error?: unknown) => reject(error ?? new Error(`No route matched ${method} ${url}`)));
  });
}

function request(router: express.Router) {
  const withBody = (method: string, url: string) => ({
    send: (body?: unknown) => dispatch(router, method, url, body),
  });
  return {
    get: (url: string) => dispatch(router, 'GET', url),
    post: (url: string) => withBody('POST', url),
    put: (url: string) => withBody('PUT', url),
    delete: (url: string) => withBody('DELETE', url),
  };
}

function createApp(user: User | null = adminUser, tenant: { id: AdspId } | null = { id: tenantId }) {
  const app = express.Router();
  app.use((req, _res, next) => {
    Object.assign(req, { user, tenant, isAuthenticated: () => Boolean(user) });
    next();
  });
  app.use(
    '/calendar/v1',
    createCalendarRouter({
      serviceId,
      logger: loggerMock as unknown as Logger,
      repository: repositoryMock as unknown as CalendarRepository,
      eventService: eventServiceMock as unknown as EventService,
      directory: directoryMock as unknown as ServiceDirectory,
      tenantService: {} as TenantService,
      tokenProvider: tokenProviderMock as unknown as TokenProvider,
      configurationService: configurationServiceMock as unknown as ConfigurationService,
    })
  );
  app.use(createErrorHandler(loggerMock as unknown as Logger));
  return app;
}

describe('calendar definition routes', () => {
  beforeEach(() => {
    directoryMock.getServiceUrl.mockResolvedValue(new URL('https://configuration.service.test'));
    tokenProviderMock.getAccessToken.mockResolvedValue('service-account-access-token');
    axiosMock.get.mockResolvedValue({ data: {} });
    axiosMock.patch.mockResolvedValue({ status: 200 });
    axiosMock.isAxiosError.mockReturnValue(false);
    repositoryMock.getCalendarEvents.mockResolvedValue({ results: [], page: {} });
  });

  afterEach(() => jest.resetAllMocks());

  describe('GET /calendar/v1/calendars', () => {
    test('returns an array of tenant and core calendars with their sources', async () => {
      // Arrange
      const tenantCalendar = { ...definition, name: 'team-planning', displayName: 'Team Planning' };
      const coreCalendar = { ...definition, name: 'provincial-holidays', displayName: 'Provincial Holidays' };
      axiosMock.get
        .mockResolvedValueOnce({ data: { [coreCalendar.name]: coreCalendar } })
        .mockResolvedValueOnce({ data: { [tenantCalendar.name]: tenantCalendar } });
      const app = createApp();

      // Act
      const response = await request(app).get(collectionPath);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          urn: `${apiId}:/calendars/team-planning`,
          name: 'team-planning',
          displayName: 'Team Planning',
          description: definition.description,
          readRoles: definition.readRoles,
          updateRoles: definition.updateRoles,
          source: 'tenant',
        },
        {
          urn: `${apiId}:/calendars/provincial-holidays`,
          name: 'provincial-holidays',
          displayName: 'Provincial Holidays',
          description: definition.description,
          readRoles: definition.readRoles,
          updateRoles: definition.updateRoles,
          source: 'core',
        },
      ]);
    });

    test('keeps both definitions when tenant and core calendars have the same name', async () => {
      // Arrange
      const tenantCalendar = { ...definition, displayName: 'Local Public Meetings' };
      const coreCalendar = { ...definition, displayName: 'Provincial Public Meetings' };
      axiosMock.get
        .mockResolvedValueOnce({ data: { [definition.name]: coreCalendar } })
        .mockResolvedValueOnce({ data: { [definition.name]: tenantCalendar } });
      const app = createApp();

      // Act
      const response = await request(app).get(collectionPath);

      // Assert
      expect(response.body).toEqual([
        expect.objectContaining({ name: definition.name, displayName: 'Local Public Meetings', source: 'tenant' }),
        expect.objectContaining({ name: definition.name, displayName: 'Provincial Public Meetings', source: 'core' }),
      ]);
    });

    test('returns only core calendars for an anonymous request without tenant context', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: { [definition.name]: definition } });
      const app = createApp(null, null);

      // Act
      const response = await request(app).get(collectionPath);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual([expect.objectContaining({ name: definition.name, source: 'core' })]);
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
    });

    test('uses the authenticated user tenant when tenant middleware has not set a tenant', async () => {
      // Arrange
      axiosMock.get
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: { [definition.name]: definition } });
      const app = createApp(adminUser, null);

      // Act
      const response = await request(app).get(collectionPath);

      // Assert
      expect(response.body).toEqual([expect.objectContaining({ name: definition.name, source: 'tenant' })]);
      expect(axiosMock.get).toHaveBeenNthCalledWith(
        2,
        `${configurationUrl}/latest`,
        expect.objectContaining({ params: { tenantId: tenantId.toString() } })
      );
    });

    test('uses a service-account token and the correct scope for each configuration read', async () => {
      // Arrange
      const app = createApp();

      // Act
      const response = await request(app).get(collectionPath);

      // Assert
      expect(response.status).toBe(200);
      expect(directoryMock.getServiceUrl.mock.calls[0][0].toString()).toBe(configurationApiId.toString());
      expect(tokenProviderMock.getAccessToken).toHaveBeenCalledTimes(1);
      expect(axiosMock.get).toHaveBeenNthCalledWith(1, `${configurationUrl}/latest`, {
        headers: { Authorization: 'Bearer service-account-access-token' },
        params: undefined,
      });
      expect(axiosMock.get).toHaveBeenNthCalledWith(2, `${configurationUrl}/latest`, {
        headers: { Authorization: 'Bearer service-account-access-token' },
        params: { tenantId: tenantId.toString() },
      });
    });

    test('accepts an actual empty configuration for both origins', async () => {
      // Arrange
      const app = createApp();

      // Act
      const response = await request(app).get(collectionPath);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /calendar/v1/calendars', () => {
    test('allows a tenant calendar-admin without configuration-admin and returns the new calendar', async () => {
      // Arrange
      const app = createApp();

      // Act
      const response = await request(app).post(collectionPath).send(definition);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        urn: `${apiId}:/calendars/${definition.name}`,
        ...definition,
        source: 'tenant',
      });
    });

    test('updates only the new tenant key with a service-account token, not the whole configuration', async () => {
      // Arrange
      const existingTenant = { ...definition, name: 'team-planning' };
      const existingCore = { ...definition, name: 'provincial-holidays' };
      axiosMock.get
        .mockResolvedValueOnce({ data: { [existingTenant.name]: existingTenant } })
        .mockResolvedValueOnce({ data: { [existingCore.name]: existingCore } });
      const app = createApp();

      // Act
      const response = await request(app).post(collectionPath).send(definition);

      // Assert
      expect(response.status).toBe(201);
      expect(axiosMock.patch).toHaveBeenCalledTimes(1);
      expect(axiosMock.patch).toHaveBeenCalledWith(
        configurationUrl,
        { operation: 'UPDATE', update: { [definition.name]: definition } },
        {
          headers: { Authorization: 'Bearer service-account-access-token' },
          params: { tenantId: tenantId.toString() },
        }
      );
    });

    test.each([
      ['tenant', { [definition.name]: definition }, {}],
      ['core', {}, { [definition.name]: definition }],
    ])('returns 409 without modifying configuration for an existing %s name', async (_origin, tenant, core) => {
      // Arrange
      axiosMock.get.mockResolvedValueOnce({ data: tenant }).mockResolvedValueOnce({ data: core });
      const app = createApp();

      // Act
      const response = await request(app).post(collectionPath).send(definition);

      // Assert
      expect(response.status).toBe(409);
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(configurationServiceMock.clearCached).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });
  });

  describe('PUT /calendar/v1/calendars/:name', () => {
    test('returns 200 and the updated tenant calendar', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: { [definition.name]: definition } });
      const updated = { ...definition, displayName: 'Updated Public Meetings' };
      const app = createApp();

      // Act
      const response = await request(app).put(`${collectionPath}/${definition.name}`).send(updated);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        urn: `${apiId}:/calendars/${definition.name}`,
        ...updated,
        source: 'tenant',
      });
    });

    test('reads only tenant configuration and updates only the named key', async () => {
      // Arrange
      const anotherCalendar = { ...definition, name: 'team-planning' };
      axiosMock.get.mockResolvedValue({
        data: { [definition.name]: definition, [anotherCalendar.name]: anotherCalendar },
      });
      const updated = { ...definition, displayName: 'Updated Public Meetings' };
      const app = createApp();

      // Act
      const response = await request(app).put(`${collectionPath}/${definition.name}`).send(updated);

      // Assert
      expect(response.status).toBe(200);
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
      expect(axiosMock.get).toHaveBeenCalledWith(`${configurationUrl}/latest`, {
        headers: { Authorization: 'Bearer service-account-access-token' },
        params: { tenantId: tenantId.toString() },
      });
      expect(axiosMock.patch).toHaveBeenCalledWith(
        configurationUrl,
        { operation: 'UPDATE', update: { [definition.name]: updated } },
        {
          headers: { Authorization: 'Bearer service-account-access-token' },
          params: { tenantId: tenantId.toString() },
        }
      );
    });

    test('returns 404 when the calendar does not belong to the tenant', async () => {
      // Arrange
      const app = createApp();

      // Act
      const response = await request(app).put(`${collectionPath}/${definition.name}`).send(definition);

      // Assert
      expect(response.status).toBe(404);
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
      expect(axiosMock.get).toHaveBeenCalledWith(
        `${configurationUrl}/latest`,
        expect.objectContaining({ params: { tenantId: tenantId.toString() } })
      );
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /calendar/v1/calendars/:name', () => {
    test('returns 204 with no response body for an empty tenant calendar', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: { [definition.name]: definition } });
      const app = createApp();

      // Act
      const response = await request(app).delete(`${collectionPath}/${definition.name}`).send();

      // Assert
      expect(response.status).toBe(204);
      expect(response.text).toBe('');
    });

    test('omits a deleted definition from the next list while retaining other calendars', async () => {
      const otherTenant = { ...definition, name: 'team-planning' };
      const core = { ...definition, name: 'provincial-holidays' };
      axiosMock.get
        .mockResolvedValueOnce({ data: { [definition.name]: definition, [otherTenant.name]: otherTenant } })
        .mockResolvedValueOnce({ data: { [core.name]: core } })
        .mockResolvedValueOnce({ data: { [otherTenant.name]: otherTenant } });
      const app = createApp();

      const deleted = await request(app).delete(`${collectionPath}/${definition.name}`).send();
      const listed = await request(app).get(collectionPath);

      expect(deleted.status).toBe(204);
      expect(listed.status).toBe(200);
      expect(listed.body).toEqual([
        expect.objectContaining({ name: otherTenant.name, source: 'tenant' }),
        expect.objectContaining({ name: core.name, source: 'core' }),
      ]);
      expect(axiosMock.get).toHaveBeenCalledTimes(3);
    });

    test('checks for events and deletes only the named tenant key', async () => {
      // Arrange
      const anotherCalendar = { ...definition, name: 'team-planning' };
      axiosMock.get.mockResolvedValue({
        data: { [definition.name]: definition, [anotherCalendar.name]: anotherCalendar },
      });
      const app = createApp();

      // Act
      const response = await request(app).delete(`${collectionPath}/${definition.name}`).send();

      // Assert
      expect(response.status).toBe(204);
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
      expect(axiosMock.get).toHaveBeenCalledWith(`${configurationUrl}/latest`, {
        headers: { Authorization: 'Bearer service-account-access-token' },
        params: { tenantId: tenantId.toString() },
      });
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(
        expect.objectContaining({ name: definition.name, tenantId }),
        1
      );
      expect(axiosMock.patch).toHaveBeenCalledWith(
        configurationUrl,
        { operation: 'DELETE', property: definition.name },
        {
          headers: { Authorization: 'Bearer service-account-access-token' },
          params: { tenantId: tenantId.toString() },
        }
      );
    });

    test('returns 404 without consulting events for a calendar missing from the tenant', async () => {
      // Arrange
      const app = createApp();

      // Act
      const response = await request(app).delete(`${collectionPath}/${definition.name}`).send();

      // Assert
      expect(response.status).toBe(404);
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
      expect(repositoryMock.getCalendarEvents).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    test('returns 409 without deleting a calendar that still has events', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: { [definition.name]: definition } });
      repositoryMock.getCalendarEvents.mockResolvedValue({ results: [{ id: 47 }], page: {} });
      const app = createApp();

      // Act
      const response = await request(app).delete(`${collectionPath}/${definition.name}`).send();

      // Assert
      expect(response.status).toBe(409);
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(configurationServiceMock.clearCached).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    const protectedRoutes = [
      { method: 'post', path: collectionPath, body: definition },
      { method: 'put', path: `${collectionPath}/${definition.name}`, body: definition },
      { method: 'delete', path: `${collectionPath}/${definition.name}`, body: {} },
    ] as const;

    test.each(protectedRoutes)('returns 401 for an anonymous $method', async ({ method, path, body }) => {
      // Arrange
      const app = createApp(null, null);

      // Act
      const response = await request(app)[method](path).send(body);

      // Assert
      expect(response.status).toBe(401);
      expect(axiosMock.get).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    test.each(protectedRoutes)(
      'returns 403 for a $method from a configuration-admin without calendar-admin',
      async ({ method, path, body }) => {
        // Arrange
        const app = createApp({ ...adminUser, roles: ['configuration-admin'] });

        // Act
        const response = await request(app)[method](path).send(body);

        // Assert
        expect(response.status).toBe(403);
        expect(axiosMock.get).not.toHaveBeenCalled();
        expect(axiosMock.patch).not.toHaveBeenCalled();
      }
    );

    test('returns 403 when a calendar-admin targets another tenant', async () => {
      // Arrange
      const app = createApp({ ...adminUser, tenantId: otherTenantId });

      // Act
      const response = await request(app).post(collectionPath).send(definition);

      // Assert
      expect(response.status).toBe(403);
      expect(axiosMock.get).not.toHaveBeenCalled();
    });

    test('requires tenant context even for a calendar-admin', async () => {
      // Arrange
      const app = createApp(adminUser, null);

      // Act
      const response = await request(app).post(collectionPath).send(definition);

      // Assert
      expect(response.status).toBe(400);
      expect(axiosMock.get).not.toHaveBeenCalled();
    });
  });

  describe('body and path validation', () => {
    const invalidDefinitions: [string, Record<string, unknown>][] = [
      ['a missing name', { ...definition, name: undefined }],
      ['a name containing a slash', { ...definition, name: 'public/meetings' }],
      ['the reserved __proto__ name', { ...definition, name: '__proto__' }],
      ['a name longer than 50 characters', { ...definition, name: 'm'.repeat(51) }],
      ['missing readRoles', { ...definition, readRoles: undefined }],
      ['missing updateRoles', { ...definition, updateRoles: undefined }],
      ['non-array readRoles', { ...definition, readRoles: 'calendar-reader' }],
      ['non-array updateRoles', { ...definition, updateRoles: 'calendar-editor' }],
      ['a nonstring read role', { ...definition, readRoles: ['calendar-reader', 42] }],
      ['a nonstring update role', { ...definition, updateRoles: [false] }],
      ['a blank displayName', { ...definition, displayName: '   ' }],
      ['a displayName longer than 32 characters', { ...definition, displayName: 'M'.repeat(33) }],
      ['a description longer than 250 characters', { ...definition, description: 'D'.repeat(251) }],
      ['a nonstring description', { ...definition, description: 2026 }],
      ['an unexpected source property', { ...definition, source: 'core' }],
    ];

    describe.each([
      ['POST', 'post', collectionPath],
      ['PUT', 'put', `${collectionPath}/${definition.name}`],
    ] as const)('%s definition body', (_label, method, path) => {
      test.each(invalidDefinitions)('returns 400 for %s', async (_reason, invalidBody) => {
        // Arrange
        const app = createApp();

        // Act
        const response = await request(app)[method](path).send(invalidBody);

        // Assert
        expect(response.status).toBe(400);
        expect(axiosMock.get).not.toHaveBeenCalled();
        expect(axiosMock.patch).not.toHaveBeenCalled();
      });
    });

    test('returns 400 when a PUT body names a different calendar from the URL', async () => {
      // Arrange
      const app = createApp();

      // Act
      const response = await request(app)
        .put(`${collectionPath}/${definition.name}`)
        .send({ ...definition, name: 'team-planning' });

      // Assert
      expect(response.status).toBe(400);
      expect(axiosMock.get).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    test.each([
      ['PUT', 'put', definition],
      ['DELETE', 'delete', {}],
    ] as const)('returns 400 for an invalid %s URL name', async (_label, method, body) => {
      // Arrange
      const app = createApp();

      // Act
      const response = await request(app)[method](`${collectionPath}/invalid%2Fname`).send(body);

      // Assert
      expect(response.status).toBe(400);
      expect(axiosMock.get).not.toHaveBeenCalled();
    });

    test.each([
      ['POST', 'post', collectionPath, {}, 201],
      ['PUT', 'put', `${collectionPath}/${definition.name}`, { [definition.name]: definition }, 200],
    ] as const)('accepts empty role arrays for %s', async (_label, method, path, existing, status) => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: existing });
      const app = createApp();

      // Act
      const response = await request(app)[method](path).send({
        name: definition.name,
        displayName: definition.displayName,
        readRoles: [],
        updateRoles: [],
      });

      // Assert
      expect(response.status).toBe(status);
      expect(response.body).toEqual(
        expect.objectContaining({ description: '', readRoles: [], updateRoles: [], source: 'tenant' })
      );
    });

    test('accepts displayName and description exactly at their length limits', async () => {
      // Arrange
      const app = createApp();

      // Act
      const response = await request(app)
        .post(collectionPath)
        .send({ ...definition, displayName: 'M'.repeat(32), description: 'D'.repeat(250) });

      // Assert
      expect(response.status).toBe(201);
    });
  });

  describe('configuration errors and cache invalidation', () => {
    test.each([
      ['create', 'post', collectionPath, {}, definition, 201],
      ['update', 'put', `${collectionPath}/${definition.name}`, { [definition.name]: definition }, definition, 200],
      ['delete', 'delete', `${collectionPath}/${definition.name}`, { [definition.name]: definition }, {}, 204],
    ] as const)('invalidates the tenant calendar cache after %s succeeds', async (_action, method, path, existing, body, status) => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: existing });
      const app = createApp();

      // Act
      const response = await request(app)[method](path).send(body);

      // Assert
      expect(response.status).toBe(status);
      expect(configurationServiceMock.clearCached).toHaveBeenCalledTimes(1);
      expect(configurationServiceMock.clearCached).toHaveBeenCalledWith(tenantId, 'platform', 'calendar-service');
    });

    test.each([
      ['create', 'post', collectionPath, {}, definition, 'calendar-definition-created'],
      ['update', 'put', `${collectionPath}/${definition.name}`, { [definition.name]: definition }, definition, 'calendar-definition-updated'],
      ['delete', 'delete', `${collectionPath}/${definition.name}`, { [definition.name]: definition }, {}, 'calendar-definition-deleted'],
    ] as const)('signals a tenant definition event after %s', async (_action, method, path, existing, body, eventName) => {
      axiosMock.get.mockResolvedValue({ data: existing });
      const app = createApp();

      await request(app)[method](path).send(body);

      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: eventName,
          tenantId,
          payload: expect.objectContaining({ calendar: expect.objectContaining({ name: definition.name }) }),
        })
      );
    });

    test.each([
      ['null', null],
      ['an array', []],
      ['a string', 'not a calendar configuration'],
      ['a number', 17],
    ])('returns 502 when a successful configuration GET returns %s', async (_label, data) => {
      // Arrange
      axiosMock.get.mockResolvedValueOnce({ data });
      const app = createApp();

      // Act
      const response = await request(app).get(collectionPath);

      // Assert
      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        errorMessage: 'Configuration service returned invalid calendar definitions.',
      });
    });

    test('returns 502 when the tenant configuration GET succeeds with null', async () => {
      // Arrange
      axiosMock.get.mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({ data: null });
      const app = createApp();

      // Act
      const response = await request(app).get(collectionPath);

      // Assert
      expect(response.status).toBe(502);
    });

    test('does not patch or invalidate the cache when configuration GET succeeds with invalid data', async () => {
      // Arrange
      axiosMock.get.mockResolvedValueOnce({ data: null });
      const app = createApp();

      // Act
      const response = await request(app).post(collectionPath).send(definition);

      // Assert
      expect(response.status).toBe(502);
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(configurationServiceMock.clearCached).not.toHaveBeenCalled();
    });

    test('returns 502 if the configuration service cannot be reached', async () => {
      // Arrange
      axiosMock.isAxiosError.mockReturnValue(true);
      axiosMock.get.mockRejectedValueOnce(new Error('Configuration connection refused'));
      const app = createApp();

      // Act
      const response = await request(app).get(collectionPath);

      // Assert
      expect(response.status).toBe(502);
    });

    test.each([
      [400, 400],
      [401, 502],
      [403, 502],
      [500, 502],
    ])('maps a configuration PATCH HTTP %s to %s without invalidating the cache', async (upstream, expected) => {
      // Arrange
      axiosMock.isAxiosError.mockReturnValue(true);
      axiosMock.patch.mockRejectedValueOnce(
        Object.assign(new Error('Configuration request failed'), {
          response: { status: upstream, data: { errorMessage: 'Calendar definition rejected.' } },
        })
      );
      const app = createApp();

      // Act
      const response = await request(app).post(collectionPath).send(definition);

      // Assert
      expect(response.status).toBe(expected);
      expect(configurationServiceMock.clearCached).not.toHaveBeenCalled();
    });
  });
});
