import {
  adspId,
  ConfigurationService,
  EventService,
  ServiceDirectory,
  TenantService,
  TokenProvider,
  User,
} from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import axios from 'axios';
import * as express from 'express';
import { Express } from 'express';
import { DateTime } from 'luxon';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { CalendarEntity, CalendarEventEntity } from '../model';
import { CalendarRepository } from '../repository';
import { CalendarServiceRoles } from '../roles';
import { CalendarEvent } from '../types';
import { createCalendarRouter } from './calendar';

jest.mock('axios');
jest.mock('ical-generator', () => ({
  ICalCalendar: jest.fn().mockImplementation(() => ({
    serve: (res: express.Response) => res.type('text/calendar').send('BEGIN:VCALENDAR\nEND:VCALENDAR'),
  })),
}));

const axiosMock = axios as jest.Mocked<typeof axios>;

// Verifies the request validation, roles, tenancy, and error responses documented in calendar.swagger.yml by sending
// requests through the router as mounted in the service (under /calendar/v1, then the error handler).
describe('calendar router documented behaviour', () => {
  const serviceId = adspId`urn:ads:platform:calendar-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c8`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'calendar.swagger.yml'));

  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const repositoryMock = {
    getDate: jest.fn(),
    getDates: jest.fn(),
    getCalendarEvents: jest.fn(),
    getCalendarEventsInRange: jest.fn(),
    getCalendarEvent: jest.fn(),
    getEventAttendees: jest.fn(),
    save: jest.fn(),
    saveAttendee: jest.fn(),
    saveExclusion: jest.fn(),
    delete: jest.fn(),
    deleteAttendee: jest.fn(),
  };
  const eventServiceMock = { send: jest.fn() };
  const directoryMock = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() };
  const tokenProviderMock = { getAccessToken: jest.fn() };
  const configurationServiceMock = { clearCached: jest.fn() };
  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({ id, name: id, email: `${id}@gov.ab.ca`, tenantId, isCore: false, roles, ...overrides }) as User;
  const admin = user('admin', [CalendarServiceRoles.Admin]);
  const coreAdmin = user('core-admin', [CalendarServiceRoles.Admin], { tenantId: undefined, isCore: true });
  const reader = user('reader', ['inspection-viewer']);
  const scheduler = user('scheduler', ['inspection-scheduler']);
  const plain = user('plain', []);
  const otherTenantScheduler = user('other-scheduler', ['inspection-scheduler'], { tenantId: otherTenantId });

  const definition = {
    name: 'site-inspections',
    displayName: 'Site inspections',
    description: 'Calendar of scheduled site inspections.',
    readRoles: ['inspection-viewer'],
    updateRoles: ['inspection-scheduler'],
  };
  const calendar = new CalendarEntity(repositoryMock as unknown as CalendarRepository, tenantId, definition);
  const configuration = { [definition.name]: calendar };
  const attendee = { id: 7, name: 'Test User', email: 'test.user@gov.ab.ca' };

  const event = (values: Partial<CalendarEvent> = {}) =>
    new CalendarEventEntity(repositoryMock as unknown as CalendarRepository, calendar, {
      id: 42,
      name: 'Site inspection',
      description: 'Inspection of the Edmonton north facility.',
      isPublic: false,
      isAllDay: false,
      start: DateTime.fromISO('2026-11-17T09:00:00-07:00'),
      end: DateTime.fromISO('2026-11-17T10:30:00-07:00'),
      ...values,
    });
  const publicEvent = () => event({ isPublic: true });
  const recurringEvent = () =>
    event({
      id: 43,
      name: 'Team meeting',
      start: DateTime.fromISO('2026-09-29T10:00:00-06:00'),
      end: DateTime.fromISO('2026-09-29T11:00:00-06:00'),
      recurrence: { frequency: 'weekly', interval: 1, daysOfWeek: ['TU'], end: { until: '2026-12-15' } },
    });

  function createApp(currentUser: User | null, hasTenant = true): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.tenant = hasTenant ? ({ id: tenantId, name: 'service-delivery' } as typeof req.tenant) : undefined;
      req.getConfiguration = jest.fn().mockResolvedValue(configuration) as typeof req.getConfiguration;
      next();
    });
    app.use(
      '/calendar/v1',
      createCalendarRouter({
        serviceId,
        logger: loggerMock,
        repository: repositoryMock as unknown as CalendarRepository,
        eventService: eventServiceMock as unknown as EventService,
        directory: directoryMock as unknown as ServiceDirectory,
        tenantService: tenantServiceMock as unknown as TenantService,
        tokenProvider: tokenProviderMock as unknown as TokenProvider,
        configurationService: configurationServiceMock as unknown as ConfigurationService,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  const configurationUnavailable = Object.assign(new Error('connect ECONNREFUSED'), { isAxiosError: true });
  const configurationRejected = Object.assign(new Error('Request failed with status code 400'), {
    isAxiosError: true,
    response: { status: 400, data: { errorMessage: 'Tenant ID is not valid.' } },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    axiosMock.isAxiosError.mockImplementation((error) => !!(error as { isAxiosError?: boolean })?.isAxiosError);
    directoryMock.getServiceUrl.mockResolvedValue(new URL('https://configuration-service.adsp.alberta.ca'));
    tokenProviderMock.getAccessToken.mockResolvedValue('token');
    repositoryMock.save.mockImplementation((entity) => Promise.resolve(entity));
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /calendar/v1/calendars', () => {
    it('responds 200 with only core definitions for anonymous requests', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { 'form-intake': { ...definition, name: 'form-intake' } } });

      const res = await request(createApp(null, false)).get('/calendar/v1/calendars');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ name: 'form-intake', source: 'core' })]);
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
    });

    it('responds 200 with tenant and core definitions for tenant users', async () => {
      axiosMock.get
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: { [definition.name]: definition } });

      const res = await request(createApp(plain)).get('/calendar/v1/calendars');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ name: definition.name, source: 'tenant' })]);
    });

    it('responds 400 when the configuration service rejects the request', async () => {
      axiosMock.get.mockRejectedValue(configurationRejected);

      const res = await request(createApp(plain)).get('/calendar/v1/calendars');

      expect(res.status).toBe(400);
    });

    it('responds 502 when the configuration service is unavailable', async () => {
      axiosMock.get.mockRejectedValue(configurationUnavailable);

      const res = await request(createApp(plain)).get('/calendar/v1/calendars');

      expect(res.status).toBe(502);
    });
  });

  describe('POST /calendar/v1/calendars', () => {
    it('responds 201 with the created tenant definition', async () => {
      axiosMock.get.mockResolvedValue({ data: {} });
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      const res = await request(createApp(admin)).post('/calendar/v1/calendars').send(definition);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: definition.name, source: 'tenant' });
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'calendar-definition-created' }),
      );
    });

    it('responds 400 for an invalid definition', async () => {
      const res = await request(createApp(admin))
        .post('/calendar/v1/calendars')
        .send({ ...definition, displayName: '' });

      expect(res.status).toBe(400);
    });

    it('responds 400 for a core administrator without tenantId', async () => {
      const res = await request(createApp(coreAdmin, false)).post('/calendar/v1/calendars').send(definition);

      expect(res.status).toBe(400);
    });

    it('responds 401 for anonymous requests', async () => {
      const res = await request(createApp(null)).post('/calendar/v1/calendars').send(definition);

      expect(res.status).toBe(401);
    });

    it('responds 403 without the calendar-admin role', async () => {
      const res = await request(createApp(scheduler)).post('/calendar/v1/calendars').send(definition);

      expect(res.status).toBe(403);
    });

    it('responds 409 when a core calendar has the name', async () => {
      axiosMock.get
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: { [definition.name]: definition } });

      const res = await request(createApp(admin)).post('/calendar/v1/calendars').send(definition);

      expect(res.status).toBe(409);
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('responds 502 when the configuration service is unavailable', async () => {
      axiosMock.get.mockRejectedValue(configurationUnavailable);

      const res = await request(createApp(admin)).post('/calendar/v1/calendars').send(definition);

      expect(res.status).toBe(502);
    });
  });

  describe('GET /calendar/v1/calendars/{name}', () => {
    it('responds 200 with the calendar', async () => {
      const res = await request(createApp(plain)).get('/calendar/v1/calendars/site-inspections');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        urn: 'urn:ads:platform:calendar-service:v1:/calendars/site-inspections',
        displayName: 'Site inspections',
      });
    });

    it('responds 200 for anonymous requests that name the tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: tenantId, name: 'service-delivery' });

      const res = await request(createApp(null, false))
        .get('/calendar/v1/calendars/site-inspections')
        .query({ tenant: 'service-delivery' });

      expect(res.status).toBe(200);
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('service-delivery');
    });

    it('responds 400 without a tenant context', async () => {
      const res = await request(createApp(null, false)).get('/calendar/v1/calendars/site-inspections');

      expect(res.status).toBe(400);
    });

    it('responds 400 for an unknown tenant name', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const res = await request(createApp(null, false))
        .get('/calendar/v1/calendars/site-inspections')
        .query({ tenant: 'unknown-tenant' });

      expect(res.status).toBe(400);
    });

    it('responds 404 when the tenant has no calendar with the name', async () => {
      const res = await request(createApp(plain)).get('/calendar/v1/calendars/unknown');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /calendar/v1/calendars/{name}', () => {
    it('responds 200 with the updated tenant definition', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { [definition.name]: definition } });
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      const res = await request(createApp(admin))
        .put('/calendar/v1/calendars/site-inspections')
        .send({ ...definition, displayName: 'Inspections' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ displayName: 'Inspections', source: 'tenant' });
    });

    it('responds 400 when the body name does not match the path', async () => {
      const res = await request(createApp(admin))
        .put('/calendar/v1/calendars/site-inspections')
        .send({ ...definition, name: 'other' });

      expect(res.status).toBe(400);
    });

    it('responds 401 for anonymous requests', async () => {
      const res = await request(createApp(null)).put('/calendar/v1/calendars/site-inspections').send(definition);

      expect(res.status).toBe(401);
    });

    it('responds 403 without the calendar-admin role', async () => {
      const res = await request(createApp(reader)).put('/calendar/v1/calendars/site-inspections').send(definition);

      expect(res.status).toBe(403);
    });

    it('responds 404 when the tenant has no calendar with the name', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: {} });

      const res = await request(createApp(admin)).put('/calendar/v1/calendars/site-inspections').send(definition);

      expect(res.status).toBe(404);
    });

    it('responds 502 when the configuration service is unavailable', async () => {
      axiosMock.get.mockRejectedValue(configurationUnavailable);

      const res = await request(createApp(admin)).put('/calendar/v1/calendars/site-inspections').send(definition);

      expect(res.status).toBe(502);
    });
  });

  describe('DELETE /calendar/v1/calendars/{name}', () => {
    it('responds 204 when the calendar has no events', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { [definition.name]: definition } });
      axiosMock.patch.mockResolvedValueOnce({ data: {} });
      repositoryMock.getCalendarEvents.mockResolvedValueOnce({ results: [], page: { size: 0 } });

      const res = await request(createApp(admin)).delete('/calendar/v1/calendars/site-inspections');

      expect(res.status).toBe(204);
    });

    it('responds 400 for an invalid name', async () => {
      const res = await request(createApp(admin)).delete('/calendar/v1/calendars/site*inspections');

      expect(res.status).toBe(400);
    });

    it('responds 401 for anonymous requests', async () => {
      const res = await request(createApp(null)).delete('/calendar/v1/calendars/site-inspections');

      expect(res.status).toBe(401);
    });

    it('responds 403 without the calendar-admin role', async () => {
      const res = await request(createApp(scheduler)).delete('/calendar/v1/calendars/site-inspections');

      expect(res.status).toBe(403);
    });

    it('responds 404 when the tenant has no calendar with the name', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: {} });

      const res = await request(createApp(admin)).delete('/calendar/v1/calendars/site-inspections');

      expect(res.status).toBe(404);
    });

    it('responds 409 when the calendar has events', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { [definition.name]: definition } });
      repositoryMock.getCalendarEvents.mockResolvedValueOnce({ results: [event()], page: { size: 1 } });

      const res = await request(createApp(admin)).delete('/calendar/v1/calendars/site-inspections');

      expect(res.status).toBe(409);
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('responds 502 when the configuration service is unavailable', async () => {
      axiosMock.get.mockRejectedValue(configurationUnavailable);

      const res = await request(createApp(admin)).delete('/calendar/v1/calendars/site-inspections');

      expect(res.status).toBe(502);
    });
  });

  describe('GET /calendar/v1/calendars/{name}/export', () => {
    it('responds 200 with an iCalendar file of only public events for anonymous requests', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: tenantId, name: 'service-delivery' });
      repositoryMock.getCalendarEvents.mockResolvedValueOnce({ results: [publicEvent()], page: { size: 1 } });
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://calendar-service.adsp.alberta.ca'));

      const res = await request(createApp(null, false))
        .get('/calendar/v1/calendars/site-inspections/export')
        .query({ tenant: 'service-delivery' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/calendar');
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(calendar, 10, undefined, { isPublic: true });
    });

    it('responds 400 without a tenant context', async () => {
      const res = await request(createApp(null, false)).get('/calendar/v1/calendars/site-inspections/export');

      expect(res.status).toBe(400);
    });

    it('responds 403 when attendees are requested without private access', async () => {
      repositoryMock.getCalendarEvents.mockResolvedValueOnce({ results: [publicEvent()], page: { size: 1 } });

      const res = await request(createApp(plain))
        .get('/calendar/v1/calendars/site-inspections/export')
        .query({ includeAttendees: 'true' });

      expect(res.status).toBe(403);
    });

    it('responds 404 when the tenant has no calendar with the name', async () => {
      const res = await request(createApp(plain)).get('/calendar/v1/calendars/unknown/export');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /calendar/v1/calendars/{name}/events', () => {
    it('responds 200 with only public events for users of another tenant', async () => {
      repositoryMock.getCalendarEvents.mockResolvedValueOnce({ results: [publicEvent()], page: { size: 1 } });

      const res = await request(createApp(otherTenantScheduler)).get('/calendar/v1/calendars/site-inspections/events');

      expect(res.status).toBe(200);
      expect(res.body.results[0]).toMatchObject({ id: 42, isPublic: true });
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(calendar, 10, undefined, { isPublic: true });
    });

    it('responds 200 with private events and attendees for readers', async () => {
      repositoryMock.getCalendarEvents.mockResolvedValueOnce({ results: [event()], page: { size: 1 } });
      repositoryMock.getEventAttendees.mockResolvedValueOnce([attendee]);

      const res = await request(createApp(reader))
        .get('/calendar/v1/calendars/site-inspections/events')
        .query({ top: '25', includeAttendees: 'true' });

      expect(res.status).toBe(200);
      expect(res.body.results[0]).toMatchObject({ isPublic: false, attendees: [attendee] });
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(calendar, 25, undefined, null);
    });

    it('responds 200 with occurrences of recurring events for range retrieval', async () => {
      repositoryMock.getCalendarEventsInRange.mockResolvedValueOnce([recurringEvent()]);

      const res = await request(createApp(reader))
        .get('/calendar/v1/calendars/site-inspections/events')
        .query({ from: '2026-10-01T00:00:00-06:00', to: '2026-10-31T23:59:59-06:00' });

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(4);
      expect(res.body.results[0]).toMatchObject({ id: 43, recurrenceId: '2026-10-06T10:00:00.000-06:00' });
      expect(res.body.page).toBeUndefined();
    });

    it('responds 400 when from is specified without to', async () => {
      const res = await request(createApp(reader))
        .get('/calendar/v1/calendars/site-inspections/events')
        .query({ from: '2026-10-01T00:00:00-06:00' });

      expect(res.status).toBe(400);
    });

    it('responds 403 when attendees are requested without private access', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: tenantId, name: 'service-delivery' });
      repositoryMock.getCalendarEvents.mockResolvedValueOnce({ results: [publicEvent()], page: { size: 1 } });

      const res = await request(createApp(null, false))
        .get('/calendar/v1/calendars/site-inspections/events')
        .query({ tenant: 'service-delivery', includeAttendees: 'true' });

      expect(res.status).toBe(403);
    });

    it('responds 404 when the tenant has no calendar with the name', async () => {
      const res = await request(createApp(reader)).get('/calendar/v1/calendars/unknown/events');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /calendar/v1/calendars/{name}/events', () => {
    const newEvent = {
      name: 'Site inspection',
      description: 'Inspection of the Edmonton north facility.',
      start: '2026-11-17T09:00:00-07:00',
      end: '2026-11-17T10:30:00-07:00',
    };

    it('responds 200 with the created event', async () => {
      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(Object.assign(entity, { id: 42 })));

      const res = await request(createApp(scheduler))
        .post('/calendar/v1/calendars/site-inspections/events')
        .send(newEvent);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 42, name: 'Site inspection', isPublic: false });
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'calendar-event-created' }));
    });

    it('responds 400 when end is missing', async () => {
      const res = await request(createApp(scheduler))
        .post('/calendar/v1/calendars/site-inspections/events')
        .send({ ...newEvent, end: undefined });

      expect(res.status).toBe(400);
    });

    it('responds 400 when end is before start', async () => {
      const res = await request(createApp(scheduler))
        .post('/calendar/v1/calendars/site-inspections/events')
        .send({ ...newEvent, end: '2026-11-17T08:00:00-07:00' });

      expect(res.status).toBe(400);
    });

    it('responds 403 for readers and anonymous users', async () => {
      const readerRes = await request(createApp(reader))
        .post('/calendar/v1/calendars/site-inspections/events')
        .send(newEvent);
      const anonymousRes = await request(createApp(null))
        .post('/calendar/v1/calendars/site-inspections/events')
        .send(newEvent);

      expect(readerRes.status).toBe(403);
      expect(anonymousRes.status).toBe(403);
    });

    it('responds 404 when the tenant has no calendar with the name', async () => {
      const res = await request(createApp(scheduler)).post('/calendar/v1/calendars/unknown/events').send(newEvent);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /calendar/v1/calendars/{name}/events/{id}', () => {
    it('responds 200 with a public event for anonymous requests that name the tenant', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: tenantId, name: 'service-delivery' });
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(publicEvent());

      const res = await request(createApp(null, false))
        .get('/calendar/v1/calendars/site-inspections/events/42')
        .query({ tenant: 'service-delivery' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 42, isPublic: true });
    });

    it('responds 400 for an event ID that is not an integer', async () => {
      const res = await request(createApp(reader)).get('/calendar/v1/calendars/site-inspections/events/abc');

      expect(res.status).toBe(400);
    });

    it('responds 403 for a private event without private access', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());

      const res = await request(createApp(plain)).get('/calendar/v1/calendars/site-inspections/events/42');

      expect(res.status).toBe(403);
    });

    it('responds 404 when the event is not found', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(null);

      const res = await request(createApp(reader)).get('/calendar/v1/calendars/site-inspections/events/42');

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /calendar/v1/calendars/{name}/events/{id}', () => {
    it('responds 200 with the updated event', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());

      const res = await request(createApp(coreAdmin))
        .patch('/calendar/v1/calendars/site-inspections/events/42')
        .send({ start: '2026-11-18T09:00:00-07:00', end: '2026-11-18T10:30:00-07:00' });

      expect(res.status).toBe(200);
      expect(res.body.start).toBe('2026-11-18T09:00:00.000-07:00');
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'calendar-event-updated' }));
    });

    it('responds 400 when end is before start', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());

      const res = await request(createApp(scheduler))
        .patch('/calendar/v1/calendars/site-inspections/events/42')
        .send({ end: '2026-11-17T08:00:00-07:00' });

      expect(res.status).toBe(400);
    });

    it('responds 403 for readers', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());

      const res = await request(createApp(reader))
        .patch('/calendar/v1/calendars/site-inspections/events/42')
        .send({ name: 'Renamed' });

      expect(res.status).toBe(403);
    });

    it('responds 404 when the event is not found', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(null);

      const res = await request(createApp(scheduler))
        .patch('/calendar/v1/calendars/site-inspections/events/42')
        .send({ name: 'Renamed' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /calendar/v1/calendars/{name}/events/{id}', () => {
    it('responds 200 when the event is deleted', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());
      repositoryMock.delete.mockResolvedValueOnce(true);

      const res = await request(createApp(scheduler)).delete('/calendar/v1/calendars/site-inspections/events/42');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('responds 400 for an event ID that is not an integer', async () => {
      const res = await request(createApp(scheduler)).delete('/calendar/v1/calendars/site-inspections/events/abc');

      expect(res.status).toBe(400);
    });

    it('responds 403 for readers', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());

      const res = await request(createApp(reader)).delete('/calendar/v1/calendars/site-inspections/events/42');

      expect(res.status).toBe(403);
    });

    it('responds 404 when the event is not found', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(null);

      const res = await request(createApp(scheduler)).delete('/calendar/v1/calendars/site-inspections/events/42');

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /calendar/v1/calendars/{name}/events/{id}/occurrences/{occurrence}', () => {
    const path = '/calendar/v1/calendars/site-inspections/events/43/occurrences/2026-10-13';

    it('responds 200 when the occurrence is cancelled', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(recurringEvent());
      repositoryMock.saveExclusion.mockResolvedValueOnce(true);

      const res = await request(createApp(scheduler)).delete(path);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('responds 400 when the event is not recurring', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event({ id: 43 }));

      const res = await request(createApp(scheduler)).delete(path);

      expect(res.status).toBe(400);
    });

    it('responds 403 for readers', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(recurringEvent());

      const res = await request(createApp(reader)).delete(path);

      expect(res.status).toBe(403);
    });

    it('responds 404 when the date is not an occurrence of the event', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(recurringEvent());

      const res = await request(createApp(scheduler)).delete(
        '/calendar/v1/calendars/site-inspections/events/43/occurrences/2026-10-14',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /calendar/v1/calendars/{name}/events/{id}/attendees', () => {
    it('responds 200 with the attendees for readers', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());
      repositoryMock.getEventAttendees.mockResolvedValueOnce([attendee]);

      const res = await request(createApp(reader)).get('/calendar/v1/calendars/site-inspections/events/42/attendees');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([attendee]);
    });

    it('responds 400 for an event ID that is not an integer', async () => {
      const res = await request(createApp(reader)).get('/calendar/v1/calendars/site-inspections/events/abc/attendees');

      expect(res.status).toBe(400);
    });

    it('responds 403 for the attendees of a public event without private access', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(publicEvent());

      const res = await request(createApp(plain)).get('/calendar/v1/calendars/site-inspections/events/42/attendees');

      expect(res.status).toBe(403);
      expect(repositoryMock.getEventAttendees).not.toHaveBeenCalled();
    });

    it('responds 404 when the event is not found', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(null);

      const res = await request(createApp(reader)).get('/calendar/v1/calendars/site-inspections/events/42/attendees');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /calendar/v1/calendars/{name}/events/{id}/attendees', () => {
    const path = '/calendar/v1/calendars/site-inspections/events/42/attendees';

    it('responds 200 with the added attendee', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());
      repositoryMock.saveAttendee.mockResolvedValueOnce(attendee);

      const res = await request(createApp(scheduler))
        .post(path)
        .send({ name: 'Test User', email: 'test.user@gov.ab.ca' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(attendee);
    });

    it('responds 400 for an invalid email', async () => {
      const res = await request(createApp(scheduler)).post(path).send({ name: 'Test User', email: '' });

      expect(res.status).toBe(400);
    });

    it('responds 403 for readers', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());

      const res = await request(createApp(reader)).post(path).send({ name: 'Test User', email: 'test.user@gov.ab.ca' });

      expect(res.status).toBe(403);
    });

    it('responds 404 when the event is not found', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(null);

      const res = await request(createApp(scheduler))
        .post(path)
        .send({ name: 'Test User', email: 'test.user@gov.ab.ca' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /calendar/v1/calendars/{name}/events/{id}/attendees/{attendeeId}', () => {
    const path = '/calendar/v1/calendars/site-inspections/events/42/attendees/7';

    it('responds 200 with the attendee', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());
      repositoryMock.getEventAttendees.mockResolvedValueOnce([attendee]);

      const res = await request(createApp(reader)).get(path);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(attendee);
    });

    it('responds 400 for an attendee ID that is not an integer', async () => {
      const res = await request(createApp(reader)).get('/calendar/v1/calendars/site-inspections/events/42/attendees/x');

      expect(res.status).toBe(400);
    });

    it('responds 403 without private access', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(publicEvent());

      const res = await request(createApp(plain)).get(path);

      expect(res.status).toBe(403);
    });

    it('responds 404 when the event has no attendee with the ID', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());
      repositoryMock.getEventAttendees.mockResolvedValueOnce([]);

      const res = await request(createApp(reader)).get(path);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /calendar/v1/calendars/{name}/events/{id}/attendees/{attendeeId}', () => {
    const path = '/calendar/v1/calendars/site-inspections/events/42/attendees/7';
    const update = { name: 'Test User', email: 'test.user2@gov.ab.ca' };

    it('responds 200 with the updated attendee', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());
      repositoryMock.saveAttendee.mockResolvedValueOnce({ ...update, id: 7 });

      const res = await request(createApp(scheduler)).put(path).send(update);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ...update, id: 7 });
    });

    it('responds 400 when name is missing', async () => {
      const res = await request(createApp(scheduler)).put(path).send({ email: 'test.user@gov.ab.ca' });

      expect(res.status).toBe(400);
    });

    it('responds 403 for readers', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());

      const res = await request(createApp(reader)).put(path).send(update);

      expect(res.status).toBe(403);
    });

    it('responds 404 when the event is not found', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(null);

      const res = await request(createApp(scheduler)).put(path).send(update);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /calendar/v1/calendars/{name}/events/{id}/attendees/{attendeeId}', () => {
    const path = '/calendar/v1/calendars/site-inspections/events/42/attendees/7';

    it('responds 200 when the attendee is removed', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());
      repositoryMock.deleteAttendee.mockResolvedValueOnce(true);

      const res = await request(createApp(scheduler)).delete(path);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('responds 400 for an attendee ID that is not an integer', async () => {
      const res = await request(createApp(scheduler)).delete(
        '/calendar/v1/calendars/site-inspections/events/42/attendees/x',
      );

      expect(res.status).toBe(400);
    });

    it('responds 403 for readers', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event());

      const res = await request(createApp(reader)).delete(path);

      expect(res.status).toBe(403);
    });

    it('responds 404 when the event is not found', async () => {
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(null);

      const res = await request(createApp(scheduler)).delete(path);

      expect(res.status).toBe(404);
    });
  });
});
