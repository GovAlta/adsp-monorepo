import { adspId, ConfigurationService, TokenProvider, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import { Request, Response } from 'express';
import { checkSchema, validationResult } from 'express-validator';
import { ICalCalendar } from 'ical-generator';
import { DateTime } from 'luxon';
import { mocked } from 'jest-mock';
import { Logger } from 'winston';
import { CalendarEntity, CalendarEventEntity } from '../model';
import { Calendar, CalendarEvent } from '../types';
import {
  addEventAttendee,
  calendarEventBodySchema,
  calendarEventUpdateBodySchema,
  createCalendarEvent,
  createCalendarRouter,
  deleteCalendarEvent,
  deleteCalendarEventOccurrence,
  deleteEventAttendee,
  exportCalendar,
  getCalendar,
  getCalendarEvent,
  getCalendarEvents,
  getCalendars,
  getEventAttendee,
  getEventAttendees,
  retrieveCalendarEvent,
  setEventAttendee,
  updateCalendarEvent,
} from './calendar';

async function validateBody(schema: Record<string, unknown>, body: Record<string, unknown>) {
  const req = { body, params: {}, query: {}, headers: {}, cookies: {} } as unknown as Request;
  await Promise.all(checkSchema(schema, ['body']).map((chain) => chain.run(req)));
  return validationResult(req);
}

jest.mock('axios');
jest.mock('ical-generator', () => {
  return {
    ICalCalendar: jest.fn().mockImplementation((data) => {
      return { data, serve: jest.fn((res) => res.send(data)) };
    }),
  };
});

describe('calendar router', () => {
  const axiosMock = axios as jest.Mocked<typeof axios>;
  const mockedICalCalendar = mocked(ICalCalendar, { shallow: true });
  const serviceId = adspId`urn:ads:platform:calendar-service`;
  const apiId = adspId`urn:ads:platform:calendar-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;
  const calendarTimeZone = 'America/Edmonton';

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

  const eventServiceMock = {
    send: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://calendar-service'))),
    getResourceUrl: jest.fn(),
  };

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const calendar: Calendar = {
    name: 'test',
    displayName: 'Test',
    description: 'Testing 1 2 3',
    readRoles: ['test-reader'],
    updateRoles: ['test-updater'],
  };

  const calendarEvent: CalendarEvent = {
    id: 12,
    name: 'test',
    description: 'Test 1 2 3',
    isPublic: false,
    isAllDay: false,
    start: DateTime.fromISO('2021-03-03T13:30:00-07:00'),
    end: DateTime.fromISO('2021-03-03T15:30:00-07:00'),
  };

  const recurringEvent: CalendarEvent = {
    id: 42,
    name: 'Team meeting',
    description: 'Weekly team meeting',
    isPublic: false,
    isAllDay: false,
    start: DateTime.fromISO('2026-09-29T10:00', { zone: calendarTimeZone }),
    end: DateTime.fromISO('2026-09-29T11:00', { zone: calendarTimeZone }),
    recurrence: { frequency: 'weekly', interval: 1, daysOfWeek: ['TU'], end: { until: '2026-12-15' } },
  };

  beforeEach(() => {
    (mockedICalCalendar as unknown as jest.Mock).mockImplementation((data) => ({
      data,
      serve: jest.fn((res) => res.send(data)),
    }));
    directoryMock.getServiceUrl.mockResolvedValue(new URL('https://calendar-service'));
    repositoryMock.getCalendarEvents.mockReset();
    repositoryMock.getCalendarEventsInRange.mockReset();
    repositoryMock.getCalendarEvent.mockReset();
    repositoryMock.getEventAttendees.mockReset();
    repositoryMock.save.mockReset();
    repositoryMock.saveAttendee.mockReset();
    repositoryMock.delete.mockReset();
    repositoryMock.deleteAttendee.mockReset();
  });

  afterEach(() => jest.resetAllMocks());

  it('can create router', () => {
    // Arrange
    const tokenProviderMock = { getAccessToken: jest.fn() };
    const configurationServiceMock = { clearCached: jest.fn() };

    // Act
    const router = createCalendarRouter({
      logger: loggerMock,
      serviceId: adspId`urn:ads:platform:calendar-service`,
      repository: repositoryMock,
      eventService: eventServiceMock,
      directory: directoryMock,
      tenantService: tenantServiceMock,
      tokenProvider: tokenProviderMock as unknown as TokenProvider,
      configurationService: configurationServiceMock as unknown as ConfigurationService,
    });

    // Assert
    expect(router).toBeTruthy();
  });

  describe('getCalendars', () => {
    const configurationDirectory = { getServiceUrl: jest.fn() };
    const tokenProvider = { getAccessToken: jest.fn() };

    beforeEach(() => {
      configurationDirectory.getServiceUrl.mockResolvedValue(new URL('https://configuration.service.test'));
      tokenProvider.getAccessToken.mockResolvedValue('service-account-access-token');
      axiosMock.get.mockResolvedValue({ data: {} });
    });

    it('can create handler', () => {
      // Arrange
      const directory = configurationDirectory as never;
      const provider = tokenProvider as unknown as TokenProvider;

      // Act
      const handler = getCalendars(apiId, directory, provider);

      // Assert
      expect(handler).toBeTruthy();
    });

    it('can get calendars', async () => {
      // Arrange
      axiosMock.get.mockResolvedValueOnce({ data: { test: calendar } });
      const req = {};
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getCalendars(apiId, configurationDirectory as never, tokenProvider as unknown as TokenProvider);

      // Act
      await handler(req as Request, res as unknown as Response, next);

      // Assert
      const [{ source, ...legacyCalendar }] = res.send.mock.calls[0][0];
      expect(source).toBe('core');
      expect([legacyCalendar]).toMatchSnapshot();
    });

    it('can handle no configuration', async () => {
      // Arrange
      const req = {};
      const res = { send: jest.fn() };
      const next = jest.fn();
      const handler = getCalendars(apiId, configurationDirectory as never, tokenProvider as unknown as TokenProvider);

      // Act
      await handler(req as Request, res as unknown as Response, next);

      // Assert
      expect(res.send).toHaveBeenCalledWith([]);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('getCalendar', () => {
    it('can create handler', () => {
      const handler = getCalendar(tenantServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can get calendar', async () => {
      const req = {
        user: {
          tenantId,
        },
        tenant: {
          id: tenantId,
        },
        getConfiguration: jest.fn(),
        params: { name: 'test' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({
        test: calendar,
      });
      const handler = getCalendar(tenantServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req['calendar']).toMatchObject(calendar);
      expect(next).toHaveBeenCalledWith();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can call next with not found', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        getConfiguration: jest.fn(),
        params: { name: 'test' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({});
      const handler = getCalendar(tenantServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(res.send).not.toBeCalled();
    });

    it('can get tenant calendar', async () => {
      const req = {
        getConfiguration: jest.fn(),
        params: { name: 'test' },
        query: { tenant: 'Test' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({
        test: calendar,
      });

      const requestTenant = adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`;
      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: requestTenant });

      const handler = getCalendar(tenantServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.getConfiguration).toHaveBeenCalledWith(requestTenant);
      expect(req['calendar']).toMatchObject(calendar);
      expect(next).toHaveBeenCalledWith();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can call next with invalid operation for no tenant', async () => {
      const req = {
        getConfiguration: jest.fn(),
        params: { name: 'test' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({});
      const handler = getCalendar(tenantServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('exportCalendarEvents', () => {
    it('can create handler', () => {
      const handler = exportCalendar(serviceId, directoryMock);
      expect(handler).toBeTruthy();
    });

    it('can export events', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {},
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getCalendarEvents.mockResolvedValueOnce(result);

      const handler = exportCalendar(serviceId, directoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(entity, 10, undefined, null);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: calendar.displayName }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can export public events for anonymous', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        params: { name: 'test' },
        query: { criteria: JSON.stringify({ isPublic: false }) },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getCalendarEvents.mockResolvedValueOnce(result);

      const handler = exportCalendar(serviceId, directoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(
        entity,
        10,
        undefined,
        expect.objectContaining({ isPublic: true }),
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: calendar.displayName }));
    });

    it('can get events with query params', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: { top: '11', after: '123' },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getCalendarEvents.mockResolvedValueOnce(result);

      const handler = exportCalendar(serviceId, directoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(entity, 11, '123', null);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: calendar.displayName }));
    });

    it('can get events with attendees', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: { includeAttendees: 'true' },
        calendar: calendarEntity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [entity], page: {} };
      repositoryMock.getCalendarEvents.mockResolvedValueOnce(result);
      repositoryMock.getEventAttendees.mockResolvedValueOnce([]);

      const handler = exportCalendar(serviceId, directoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(calendarEntity, 10, undefined, null);
      expect(repositoryMock.getEventAttendees).toHaveBeenCalledWith(entity);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: calendar.displayName }));
    });

    it('can get events with query criteria', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {
          criteria: JSON.stringify({
            isPublic: false,
            startsAfter: '2020-03-05',
            endsBefore: '2020-05-01',
          }),
        },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getCalendarEvents.mockResolvedValueOnce(result);

      const handler = exportCalendar(serviceId, directoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(
        entity,
        10,
        undefined,
        expect.objectContaining({ isPublic: false }),
      );
      expect(repositoryMock.getCalendarEvents.mock.calls[0][3].startsAfter.valueOf()).toBe(
        DateTime.fromISO('2020-03-05T00:00:00', { zone: calendarTimeZone }).valueOf(),
      );
      expect(repositoryMock.getCalendarEvents.mock.calls[0][3].endsBefore.valueOf()).toBe(
        DateTime.fromISO('2020-05-01T00:00:00', { zone: calendarTimeZone }).valueOf(),
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: calendar.displayName }));
    });
  });

  describe('exportCalendar with recurring events', () => {
    it('can export recurring event with repeating rule and exclusions', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const series = new CalendarEventEntity(repositoryMock, calendarEntity, recurringEvent);
      series.exclusions = [20261013];
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getCalendarEvents.mockResolvedValueOnce({ results: [series], page: {} });

      const handler = exportCalendar(serviceId, directoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      const [exported] = res.send.mock.calls[0][0].events;
      expect(exported.repeating).toEqual(
        expect.objectContaining({ freq: 'WEEKLY', interval: 1, byDay: ['TU'], startOfWeek: 'MO' }),
      );
      // Compare local wall time and instant rather than a hard-coded offset, since the UTC offset of
      // America/Edmonton after Nov 1, 2026 depends on the tzdata version in the runtime.
      expect(exported.repeating.until.zoneName).toBe(calendarTimeZone);
      expect(exported.repeating.until.toISO({ includeOffset: false })).toBe('2026-12-15T23:59:59.999');
      expect(exported.repeating.until.valueOf()).toBe(
        DateTime.fromISO('2026-12-15', { zone: calendarTimeZone }).endOf('day').valueOf(),
      );
      expect(exported.repeating.exclude.map((value) => value.toISO())).toEqual(['2026-10-13T10:00:00.000-06:00']);
    });
  });

  describe('getCalendarEvents', () => {
    it('can create handler', () => {
      const handler = getCalendarEvents(apiId);
      expect(handler).toBeTruthy();
    });

    it('can get events', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {},
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getCalendarEvents.mockResolvedValueOnce(result);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(entity, 10, undefined, null);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can get public events for anonymous', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        params: { name: 'test' },
        query: { criteria: JSON.stringify({ isPublic: false }) },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getCalendarEvents.mockResolvedValueOnce(result);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(
        entity,
        10,
        undefined,
        expect.objectContaining({ isPublic: true }),
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can get events with query params', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: { top: '11', after: '123' },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getCalendarEvents.mockResolvedValueOnce(result);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(entity, 11, '123', null);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can get all events overlapping a date range without pagination', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const results = Array.from(
        { length: 11 },
        (_, index) =>
          new CalendarEventEntity(repositoryMock, entity, {
            ...calendarEvent,
            id: index + 1,
            name: `test-${index + 1}`,
          }),
      );
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {
          from: '2021-03-01T00:00:00-07:00',
          to: '2021-03-31T23:59:59-06:00',
          top: '1',
          after: '123',
          criteria: JSON.stringify({ isPublic: false }),
        },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getCalendarEventsInRange.mockResolvedValueOnce(results);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.getCalendarEvents).not.toHaveBeenCalled();
      expect(repositoryMock.getCalendarEventsInRange).toHaveBeenCalledWith(
        entity,
        expect.any(DateTime),
        expect.any(DateTime),
        expect.objectContaining({ isPublic: false }),
      );
      expect(repositoryMock.getCalendarEventsInRange.mock.calls[0][1].valueOf()).toBe(
        DateTime.fromISO('2021-03-01T00:00:00-07:00').valueOf(),
      );
      expect(repositoryMock.getCalendarEventsInRange.mock.calls[0][2].valueOf()).toBe(
        DateTime.fromISO('2021-03-31T23:59:59-06:00').valueOf(),
      );
      expect(res.send).toHaveBeenCalledWith({
        results: expect.arrayContaining([expect.objectContaining({ id: 11, name: 'test-11' })]),
      });
      expect(res.send.mock.calls[0][0].results).toHaveLength(11);
      expect(res.send.mock.calls[0][0]).not.toHaveProperty('page');
    });

    it('can get events overlapping a date range with query criteria', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {
          from: '2021-03-01T00:00:00-07:00',
          to: '2021-03-31T23:59:59-06:00',
          criteria: JSON.stringify({
            isPublic: false,
            recordId: 'record-1',
            startsAfter: '2021-03-05',
            endsBefore: '2021-03-20',
          }),
        },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getCalendarEventsInRange.mockResolvedValueOnce([]);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.getCalendarEvents).not.toHaveBeenCalled();
      expect(repositoryMock.getCalendarEventsInRange).toHaveBeenCalledWith(
        entity,
        expect.any(DateTime),
        expect.any(DateTime),
        expect.objectContaining({ isPublic: false, recordId: 'record-1' }),
      );
      expect(repositoryMock.getCalendarEventsInRange.mock.calls[0][3].startsAfter.valueOf()).toBe(
        DateTime.fromISO('2021-03-05T00:00:00', { zone: calendarTimeZone }).valueOf(),
      );
      expect(repositoryMock.getCalendarEventsInRange.mock.calls[0][3].endsBefore.valueOf()).toBe(
        DateTime.fromISO('2021-03-20T00:00:00', { zone: calendarTimeZone }).valueOf(),
      );
      expect(res.send).toHaveBeenCalledWith({ results: [] });
    });

    it('can parse offsetless date range values in the calendar timezone', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {
          from: '2021-03-01T00:00:00',
          to: '2021-03-31T23:59:59',
        },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getCalendarEventsInRange.mockResolvedValueOnce([]);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);

      const [, from, to] = repositoryMock.getCalendarEventsInRange.mock.calls[0];
      expect(from.zoneName).toBe(calendarTimeZone);
      expect(from.toFormat("yyyy-LL-dd'T'HH:mm:ss")).toBe('2021-03-01T00:00:00');
      expect(to.zoneName).toBe(calendarTimeZone);
      expect(to.toFormat("yyyy-LL-dd'T'HH:mm:ss")).toBe('2021-03-31T23:59:59');
    });

    it('can get public events overlapping a date range for anonymous', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        params: { name: 'test' },
        query: {
          from: '2021-03-01T00:00:00-07:00',
          to: '2021-03-31T23:59:59-06:00',
        },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getCalendarEventsInRange.mockResolvedValueOnce([]);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEventsInRange).toHaveBeenCalledWith(
        entity,
        expect.any(DateTime),
        expect.any(DateTime),
        { isPublic: true },
      );
      expect(res.send).toHaveBeenCalledWith({ results: [] });
    });

    it('can expand recurring events in a date range', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const series = new CalendarEventEntity(repositoryMock, entity, recurringEvent);
      series.exclusions = [20261013];
      const single = new CalendarEventEntity(repositoryMock, entity, {
        ...calendarEvent,
        start: DateTime.fromISO('2026-10-15T09:00', { zone: calendarTimeZone }),
        end: DateTime.fromISO('2026-10-15T10:00', { zone: calendarTimeZone }),
      });
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {
          from: '2026-10-01T00:00:00-06:00',
          to: '2026-10-31T23:59:59-06:00',
        },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getCalendarEventsInRange.mockResolvedValueOnce([series, single]);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      const { results } = res.send.mock.calls[0][0];
      expect(results.map((result) => result.start.toISO())).toEqual([
        '2026-10-06T10:00:00.000-06:00',
        '2026-10-15T09:00:00.000-06:00',
        '2026-10-20T10:00:00.000-06:00',
        '2026-10-27T10:00:00.000-06:00',
      ]);
      expect(results[0]).toEqual(
        expect.objectContaining({
          urn: 'urn:ads:platform:calendar-service:v1:/calendars/test/events/42/occurrences/2026-10-06',
          id: 42,
          name: 'Team meeting',
          recurrence: recurringEvent.recurrence,
        }),
      );
      expect(results[0].recurrenceId.toISO()).toBe('2026-10-06T10:00:00.000-06:00');
      expect(results[0].end.toISO()).toBe('2026-10-06T11:00:00.000-06:00');
      expect(results[0].recurrence).not.toHaveProperty('exclusions');
      expect(results[1]).toEqual(
        expect.objectContaining({ urn: 'urn:ads:platform:calendar-service:v1:/calendars/test/events/12', id: 12 }),
      );
      expect(results[1]).not.toHaveProperty('recurrenceId');
      expect(results[1]).not.toHaveProperty('recurrence');
    });

    it('can load attendees once per recurring event in a date range', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const series = new CalendarEventEntity(repositoryMock, entity, recurringEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {
          from: '2026-10-01T00:00:00-06:00',
          to: '2026-10-31T23:59:59-06:00',
          includeAttendees: 'true',
        },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getCalendarEventsInRange.mockResolvedValueOnce([series]);
      repositoryMock.getEventAttendees.mockResolvedValueOnce([{ id: 1, name: 'Tester', email: 'tester@test.co' }]);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      const { results } = res.send.mock.calls[0][0];
      expect(repositoryMock.getEventAttendees).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(4);
      expect(results.every((result) => result.attendees?.length === 1)).toBe(true);
    });

    it('can call next with invalid operation for partial range', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: { from: '2021-03-01T00:00:00-07:00' },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(repositoryMock.getCalendarEventsInRange).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can call next with invalid operation for oversized range', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {
          from: '2021-01-01T00:00:00-07:00',
          to: '2022-01-03T00:00:00-07:00',
        },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(repositoryMock.getCalendarEventsInRange).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can get events with query criteria', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {
          criteria: JSON.stringify({
            isPublic: false,
            startsAfter: '2020-03-05',
            endsBefore: '2020-05-01',
          }),
        },
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getCalendarEvents.mockResolvedValueOnce(result);

      const handler = getCalendarEvents(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(
        entity,
        10,
        undefined,
        expect.objectContaining({ isPublic: false }),
      );
      expect(repositoryMock.getCalendarEvents.mock.calls[0][3].startsAfter.valueOf()).toBe(
        DateTime.fromISO('2020-03-05T00:00:00', { zone: calendarTimeZone }).valueOf(),
      );
      expect(repositoryMock.getCalendarEvents.mock.calls[0][3].endsBefore.valueOf()).toBe(
        DateTime.fromISO('2020-05-01T00:00:00', { zone: calendarTimeZone }).valueOf(),
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });
  });

  describe('getCalendarEvent', () => {
    it('can get event', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { id: '12' },
        query: {},
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const event = new CalendarEventEntity(repositoryMock, entity, calendarEvent);
      repositoryMock.getCalendarEvent.mockResolvedValueOnce(event);

      await getCalendarEvent(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvent).toHaveBeenCalledWith(entity, 12);
      expect(req['event']).toMatchObject(calendarEvent);
      expect(next).toHaveBeenCalledWith();
    });

    it('can call next with not found', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { id: '12' },
        query: {},
        calendar: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getCalendarEvent.mockResolvedValueOnce(null);

      await getCalendarEvent(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvent).toHaveBeenCalledWith(entity, 12);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('calendar event body validation', () => {
    it('create schema requires name and start', async () => {
      const result = await validateBody(calendarEventBodySchema, { description: 'test' });
      expect(result.isEmpty()).toBe(false);
    });

    it('create schema passes with required fields', async () => {
      const result = await validateBody(calendarEventBodySchema, {
        name: 'test',
        start: '2021-03-03T13:30:00-07:00',
        end: '2021-03-03T15:30:00-07:00',
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('update schema allows a partial body with only end supplied', async () => {
      const result = await validateBody(calendarEventUpdateBodySchema, { end: '2021-03-03T16:30:00-07:00' });
      expect(result.isEmpty()).toBe(true);
    });

    it('update schema allows an empty body', async () => {
      const result = await validateBody(calendarEventUpdateBodySchema, {});
      expect(result.isEmpty()).toBe(true);
    });

    it('update schema still validates supplied fields', async () => {
      const result = await validateBody(calendarEventUpdateBodySchema, { isPublic: 'not-a-boolean' });
      expect(result.isEmpty()).toBe(false);
    });

    it('create schema rejects recurrence that is not an object', async () => {
      const result = await validateBody(calendarEventBodySchema, {
        name: 'test',
        start: '2026-09-29T10:00:00-06:00',
        end: '2026-09-29T11:00:00-06:00',
        recurrence: 'weekly',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('create schema passes with recurrence', async () => {
      const result = await validateBody(calendarEventBodySchema, {
        name: 'test',
        start: '2026-09-29T10:00:00-06:00',
        end: '2026-09-29T11:00:00-06:00',
        recurrence: { frequency: 'weekly' },
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('update schema allows null recurrence', async () => {
      const result = await validateBody(calendarEventUpdateBodySchema, { recurrence: null });
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('createCalendarEvent', () => {
    it('can create handler', () => {
      const handler = createCalendarEvent(apiId, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can create event', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        body: { start: '2020-03-05T13:30:45-07:00', name: 'test', description: 'Test 1 2 3' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve({ ...entity, id: 1 }));

      const handler = createCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'test', description: 'Test 1 2 3' }));
      expect(res.send.mock.calls[0][0].start.valueOf()).toBe(DateTime.fromISO('2020-03-05T13:30:45-07:00').valueOf());
      expect(res.send.mock.calls[0][0]).toMatchSnapshot({
        start: expect.any(DateTime),
      });
    });

    it('can create event from UTC input in the calendar timezone', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        body: {
          start: '2020-03-05T20:30:45.000Z',
          end: '2020-03-05T21:30:45.000Z',
          name: 'test',
          description: 'Test 1 2 3',
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve({ ...entity, id: 1 }));

      const handler = createCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      const created = res.send.mock.calls[0][0];
      expect(created.start.zoneName).toBe(calendarTimeZone);
      expect(created.start.toFormat("yyyy-LL-dd'T'HH:mm:ss")).toBe('2020-03-05T13:30:45');
      expect(created.end.zoneName).toBe(calendarTimeZone);
      expect(created.end.toFormat("yyyy-LL-dd'T'HH:mm:ss")).toBe('2020-03-05T14:30:45');
    });

    it('can call next with unauthorized', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: [],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        body: {
          start: '2020-03-05T13:30:45',
          end: '2020-03-05T14:30:45',
          name: 'test',
          description: 'Test 1 2 3',
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = createCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('createCalendarEvent with recurrence', () => {
    it('can create recurring event', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        body: {
          name: 'Team meeting',
          start: '2026-09-29T10:00:00-06:00',
          end: '2026-09-29T11:00:00-06:00',
          recurrence: { frequency: 'weekly', end: { until: '2026-12-15' } },
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = createCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      const recurrence = { frequency: 'weekly', interval: 1, daysOfWeek: ['TU'], end: { until: '2026-12-15' } };
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ recurrence: { ...recurrence, exclusions: [] } }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'calendar-event-created',
          payload: expect.objectContaining({ event: expect.objectContaining({ recurrence }) }),
        }),
      );
    });

    it('can call next with invalid operation for invalid recurrence', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        body: {
          name: 'Team meeting',
          start: '2026-09-29T10:00:00-06:00',
          recurrence: { frequency: 'daily', daysOfWeek: ['TU'] },
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = createCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.save).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('retrieveCalendarEvent', () => {
    it('can create handler', () => {
      const handler = retrieveCalendarEvent(apiId);
      expect(handler).toBeTruthy();
    });
    it('can retrieve event', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { id: '12' },
        query: {},
        event: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = retrieveCalendarEvent(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(calendarEvent));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot({
        start: expect.any(DateTime),
        end: expect.any(DateTime),
      });
    });

    it('can retrieve event with attendees', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { id: '12' },
        query: { includeAttendees: 'true' },
        event: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getEventAttendees.mockResolvedValueOnce([]);

      const handler = retrieveCalendarEvent(apiId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getEventAttendees).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(calendarEvent));
    });
  });

  describe('updateCalendarEvent', () => {
    it('can create handler', () => {
      const handler = updateCalendarEvent(apiId, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can update event', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'test 2', start: '2020-03-05T11:00:00-07:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = updateCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'test 2' }));
      expect(res.send.mock.calls[0][0].start.valueOf()).toBe(DateTime.fromISO('2020-03-05T11:00:00-07:00').valueOf());
      expect(res.send.mock.calls[0][0]).toMatchSnapshot({
        start: expect.any(DateTime),
        end: expect.any(DateTime),
      });
    });

    it('can update event from offsetless input in the calendar timezone', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { start: '2020-03-05T11:00:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = updateCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      const updated = res.send.mock.calls[0][0];
      expect(updated.start.zoneName).toBe(calendarTimeZone);
      expect(updated.start.toFormat("yyyy-LL-dd'T'HH:mm:ss")).toBe('2020-03-05T11:00:00');
    });

    it('can call next with unauthorized', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: [],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'test 2', start: '2020-03-05T11:00:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = updateCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.save).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can partially update event and leave other properties unchanged', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { end: '2021-03-03T16:30:00-07:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = updateCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ name: calendarEvent.name, description: calendarEvent.description }),
      );
      expect(res.send.mock.calls[0][0].start.valueOf()).toBe(calendarEvent.start.valueOf());
      expect(res.send.mock.calls[0][0].end.valueOf()).toBe(DateTime.fromISO('2021-03-03T16:30:00-07:00').valueOf());
    });
  });

  describe('deleteCalendarEvent', () => {
    it('can create handler', () => {
      const handler = deleteCalendarEvent(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete event', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'test 2', start: '2020-03-05T11:00:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.delete.mockResolvedValueOnce(true);

      const handler = deleteCalendarEvent(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can call next with unauthorized', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: [],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'test 2', start: '2020-03-05T11:00:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = deleteCalendarEvent(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.delete).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('updateCalendarEvent with recurrence', () => {
    it('can replace recurrence of event', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, recurringEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { recurrence: { frequency: 'weekly', daysOfWeek: ['TU'], end: { until: '2026-11-10' } } },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = updateCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          recurrence: {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: ['TU'],
            end: { until: '2026-11-10' },
            exclusions: [],
          },
        }),
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'calendar-event-updated' }));
    });

    it('can remove recurrence of event', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, recurringEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { recurrence: null },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = updateCalendarEvent(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send.mock.calls[0][0]).not.toHaveProperty('recurrence');
    });
  });

  describe('deleteCalendarEventOccurrence', () => {
    const createRequest = (occurrence: string, roles = ['test-updater'], event: CalendarEvent = recurringEvent) => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, event);
      return {
        user: {
          tenantId,
          roles,
        },
        params: { name: 'test', id: `${event.id}`, occurrence },
        query: {},
        calendar: calendarEntity,
        event: entity,
      };
    };

    it('can create handler', () => {
      const handler = deleteCalendarEventOccurrence(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can cancel occurrence by date', async () => {
      const req = createRequest('2026-10-13');
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.saveExclusion.mockResolvedValueOnce(true);

      const handler = deleteCalendarEventOccurrence(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.saveExclusion).toHaveBeenCalledWith(req.event, 20261013);
      expect(res.send).toHaveBeenCalledWith({ deleted: true });
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'calendar-event-updated',
          payload: expect.objectContaining({
            update: { operation: 'exclude-occurrence', recurrenceId: '2026-10-13T10:00:00.000-06:00' },
          }),
        }),
      );
    });

    it('can cancel occurrence by recurrence ID in another offset', async () => {
      const req = createRequest('2026-11-03T17:00:00.000Z');
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.saveExclusion.mockResolvedValueOnce(true);

      const handler = deleteCalendarEventOccurrence(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.saveExclusion).toHaveBeenCalledWith(req.event, 20261103);
      expect(res.send).toHaveBeenCalledWith({ deleted: true });
    });

    it('can return not deleted without signalling for already cancelled occurrence', async () => {
      const req = createRequest('2026-10-13');
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.saveExclusion.mockResolvedValueOnce(false);

      const handler = deleteCalendarEventOccurrence(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith({ deleted: false });
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('can call next with not found for date that is not an occurrence', async () => {
      const req = createRequest('2026-10-14');
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = deleteCalendarEventOccurrence(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next with invalid operation for non-recurring event', async () => {
      const req = createRequest('2021-03-03', ['test-updater'], calendarEvent);
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = deleteCalendarEventOccurrence(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with unauthorized', async () => {
      const req = createRequest('2026-10-13', ['test-reader']);
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = deleteCalendarEventOccurrence(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.saveExclusion).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getEventAttendees', () => {
    it('can get attendees', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'test 2', start: '2020-03-05T11:00:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getEventAttendees.mockResolvedValueOnce([]);

      await getEventAttendees(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith([]);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can call next with unauthorized', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: [],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'test 2', start: '2020-03-05T11:00:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await getEventAttendees(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('addEventAttendee', () => {
    it('can create handler', () => {
      const handler = addEventAttendee(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can add attendee', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'tester', email: 'tester@test.co' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.saveAttendee.mockImplementationOnce((_, attendee) => Promise.resolve(attendee));

      const handler = addEventAttendee(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(req.body));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can call next with unauthorized', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: [],
        },
        params: { name: 'test' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'test 2', start: '2020-03-05T11:00:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = addEventAttendee(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('setEventAttendee', () => {
    it('can create handler', () => {
      const handler = setEventAttendee(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can set attendee', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { attendeeId: '23' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'tester 2', email: 'tester@test.co' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.saveAttendee.mockImplementationOnce((_, attendee) => Promise.resolve(attendee));

      const handler = setEventAttendee(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ ...req.body, id: 23 }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can call next with unauthorized', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: [],
        },
        params: { attendeeId: '23' },
        query: {},
        calendar: calendarEntity,
        event: entity,
        body: { name: 'test 2', start: '2020-03-05T11:00:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = setEventAttendee(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('deleteEventAttendee', () => {
    it('can create handler', () => {
      const handler = deleteEventAttendee(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete attendee', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-updater'],
        },
        params: { attendeeId: '23' },
        query: {},
        calendar: calendarEntity,
        event: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.deleteAttendee.mockResolvedValueOnce(true);

      const handler = deleteEventAttendee(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can call next with unauthorized', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: [],
        },
        params: { attendeeId: '23' },
        query: {},
        calendar: calendarEntity,
        event: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = deleteEventAttendee(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getEventAttendee', () => {
    it('can delete attendee', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { attendeeId: '23' },
        query: {},
        calendar: calendarEntity,
        event: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const attendee = { id: 23, name: 'tester', email: 'tester@test.co' };
      repositoryMock.getEventAttendees.mockResolvedValueOnce([attendee]);

      await getEventAttendee(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(attendee));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can call next with unauthorized', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: [],
        },
        params: { attendeeId: '23' },
        query: {},
        calendar: calendarEntity,
        event: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await getEventAttendee(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with not found', async () => {
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, calendar);
      const entity = new CalendarEventEntity(repositoryMock, calendarEntity, calendarEvent);
      const req = {
        user: {
          tenantId,
          roles: ['test-reader'],
        },
        params: { attendeeId: '23' },
        query: {},
        calendar: calendarEntity,
        event: entity,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getEventAttendees.mockResolvedValueOnce([]);

      await getEventAttendee(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});
