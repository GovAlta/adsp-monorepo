import { AdspId, adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { ICalCalendar } from 'ical-generator';
import { DateTime } from 'luxon';
import { mocked } from 'ts-jest/utils';
import { Logger } from 'winston';
import { CalendarEntity, CalendarEventEntity } from '../model';
import { Calendar, CalendarEvent } from '../types';
import {
  addEventAttendee,
  createCalendarEvent,
  createCalendarRouter,
  deleteCalendarEvent,
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

jest.mock('ical-generator', () => {
  return {
    ICalCalendar: jest.fn().mockImplementation((data) => {
      return { data, serve: jest.fn((res) => res.send(data)) };
    }),
  };
});

describe('calendar router', () => {
  const mockedICalCalendar = mocked(ICalCalendar, true);
  const serviceId = adspId`urn:ads:platform:calendar-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    getDate: jest.fn(),
    getDates: jest.fn(),
    getCalendarEvents: jest.fn(),
    getCalendarEvent: jest.fn(),
    getEventAttendees: jest.fn(),
    save: jest.fn(),
    saveAttendee: jest.fn(),
    delete: jest.fn(),
    deleteAttendee: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://calendar-service'))),
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
    start: DateTime.fromISO('2021-03-03T13:30:00'),
    end: DateTime.fromISO('2021-03-03T15:30:00'),
  };

  beforeEach(() => {
    mockedICalCalendar.mockClear();
    repositoryMock.getCalendarEvents.mockReset();
    repositoryMock.getCalendarEvent.mockReset();
    repositoryMock.getEventAttendees.mockReset();
    repositoryMock.save.mockReset();
    repositoryMock.saveAttendee.mockReset();
    repositoryMock.delete.mockReset();
    repositoryMock.deleteAttendee.mockReset();
  });

  it('can create router', () => {
    const router = createCalendarRouter({
      logger: loggerMock,
      serviceId: adspId`urn:ads:platform:calendar-service`,
      repository: repositoryMock,
      eventService: eventServiceMock,
      directory: directoryMock,
    });

    expect(router).toBeTruthy();
  });

  describe('getCalendars', () => {
    it('can get calendars', async () => {
      const req = {
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([
        {
          test: calendar,
        },
      ]);
      await getCalendars(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining(calendar)]));
    });
  });

  describe('getCalendar', () => {
    it('can get calendar', async () => {
      const req = {
        user: {
          tenantId,
        },
        getConfiguration: jest.fn(),
        params: { name: 'test' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([
        {
          test: calendar,
        },
      ]);
      await getCalendar(req as unknown as Request, res as unknown as Response, next);
      expect(req['calendar']).toMatchObject(calendar);
      expect(next).toHaveBeenCalledWith();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can call next with not found', async () => {
      const req = {
        getConfiguration: jest.fn(),
        params: { name: 'test' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([{}]);
      await getCalendar(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(res.send).not.toBeCalled();
    });

    it('can get tenant calendar', async () => {
      const req = {
        getConfiguration: jest.fn(),
        params: { name: 'test' },
        query: { tenant: '123' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([
        {
          test: calendar,
        },
      ]);
      await getCalendar(req as unknown as Request, res as unknown as Response, next);
      expect(req.getConfiguration).toHaveBeenCalledWith(expect.any(AdspId));
      expect(req['calendar']).toMatchObject(calendar);
      expect(next).toHaveBeenCalledWith();
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
        expect.objectContaining({ isPublic: true })
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
        expect.objectContaining({ isPublic: false })
      );
      expect(repositoryMock.getCalendarEvents.mock.calls[0][3].startsAfter.valueOf()).toBe(
        DateTime.fromObject({ year: 2020, month: 3, day: 5 }).valueOf()
      );
      expect(repositoryMock.getCalendarEvents.mock.calls[0][3].endsBefore.valueOf()).toBe(
        DateTime.fromObject({ year: 2020, month: 5, day: 1 }).valueOf()
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: calendar.displayName }));
    });
  });

  describe('getCalendarEvents', () => {
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

      await getCalendarEvents(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(entity, 10, undefined, null);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
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

      await getCalendarEvents(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(
        entity,
        10,
        undefined,
        expect.objectContaining({ isPublic: true })
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

      await getCalendarEvents(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(entity, 11, '123', null);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
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

      await getCalendarEvents(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(
        entity,
        10,
        undefined,
        expect.objectContaining({ isPublic: false })
      );
      expect(repositoryMock.getCalendarEvents.mock.calls[0][3].startsAfter.valueOf()).toBe(
        DateTime.fromObject({ year: 2020, month: 3, day: 5 }).valueOf()
      );
      expect(repositoryMock.getCalendarEvents.mock.calls[0][3].endsBefore.valueOf()).toBe(
        DateTime.fromObject({ year: 2020, month: 5, day: 1 }).valueOf()
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

  describe('createCalendarEvent', () => {
    it('can create handler', () => {
      const handler = createCalendarEvent(eventServiceMock);
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
        body: { start: '2020-03-05T13:30:45', name: 'test', description: 'Test 1 2 3' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = createCalendarEvent(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'test', description: 'Test 1 2 3' }));
      expect(res.send.mock.calls[0][0].start.valueOf()).toBe(DateTime.fromISO('2020-03-05T13:30:45').valueOf());
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

      const handler = createCalendarEvent(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('retrieveCalendarEvent', () => {
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

      await retrieveCalendarEvent(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(calendarEvent));
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

      await retrieveCalendarEvent(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getEventAttendees).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(calendarEvent));
    });
  });

  describe('updateCalendarEvent', () => {
    it('can create handler', () => {
      const handler = updateCalendarEvent(eventServiceMock);
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
        body: { name: 'test 2', start: '2020-03-05T11:00:00' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = updateCalendarEvent(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'test 2' }));
      expect(res.send.mock.calls[0][0].start.valueOf()).toBe(DateTime.fromISO('2020-03-05T11:00:00').valueOf());
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

      const handler = updateCalendarEvent(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.save).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
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
