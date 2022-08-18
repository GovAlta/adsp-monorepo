import { AdspId, EventService, ServiceDirectory, TenantService } from '@abgov/adsp-service-sdk';
import { createValidationHandler, NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { checkSchema, param } from 'express-validator';
import { ICalCalendar } from 'ical-generator';
import { DateTime } from 'luxon';
import { Logger } from 'winston';
import { environment } from '../../environments/environment';
import { calendarEventCreated, calendarEventDeleted, calendarEventUpdated } from '../events';
import { CalendarEntity, CalendarEventEntity } from '../model';
import { CalendarRepository } from '../repository';
import { Attendee, CalendarServiceConfiguration } from '../types';

interface DateRouterProps {
  serviceId: AdspId;
  logger: Logger;
  repository: CalendarRepository;
  eventService: EventService;
  directory: ServiceDirectory;
  tenantService: TenantService;
}

function mapCalendar(entity: CalendarEntity) {
  return {
    name: entity.name,
    displayName: entity.displayName,
    description: entity.description,
    readRoles: entity.readRoles,
    updateRoles: entity.updateRoles,
  };
}

function mapCalendarEvent(entity: CalendarEventEntity) {
  const dto = {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    start: entity.start,
    end: entity.end,
    isAllDay: entity.isAllDay,
    isPublic: entity.isPublic,
  };

  if (entity.attendees) {
    dto['attendees'] = entity.attendees.map(mapEventAttendee);
  }

  return dto;
}

function mapEventAttendee(attendee: Attendee) {
  return {
    id: attendee.id,
    name: attendee.name,
    email: attendee.email,
  };
}

export const getCalendars: RequestHandler = async (req, res, next) => {
  try {
    const [calendars] = await req.getConfiguration<CalendarServiceConfiguration>();

    const results = Object.entries(calendars).map(([_k, calender]) => mapCalendar(calender));
    res.send(results);
  } catch (err) {
    next(err);
  }
};

const CALENDAR_KEY = 'calendar';
const { TIME_ZONE } = environment;
export function getCalendar(tenantService: TenantService): RequestHandler {
  return async (req, _res, next) => {
    try {
      const { name } = req.params;
      const { tenant } = req.query;

      // Calendar service permits cross-tenant access for tenant and anonymous users to get public events.
      if (tenant) {
        req.tenant = await tenantService.getTenantByName(tenant as string);
      }

      const tenantId = req.tenant?.id;
      const [calendars] = await req.getConfiguration<CalendarServiceConfiguration>(tenantId);

      const calendar = calendars?.[name];
      if (!calendar) {
        throw new NotFoundError('Calendar', name);
      }

      req[CALENDAR_KEY] = calendar;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const exportCalendar =
  (serviceId: AdspId, directory: ServiceDirectory): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const calendar: CalendarEntity = req[CALENDAR_KEY];
      const { top: topValue, after, filename, includeAttendees, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria = criteriaValue ? JSON.parse(criteriaValue as string) : null;
      if (criteria?.startsAfter) {
        criteria.startsAfter = DateTime.fromISO(criteria.startsAfter);
      }
      if (criteria?.endsBefore) {
        criteria.endsBefore = DateTime.fromISO(criteria.endsBefore);
      }

      const { results } = await calendar.getEvents(user, top, after as string, criteria);
      if (includeAttendees === 'true') {
        for (const result of results) {
          await result.loadAttendees(user);
        }
      }

      const serviceUrl = await directory.getServiceUrl(serviceId);

      const iCal = new ICalCalendar({
        prodId: `//Government of Alberta//${serviceId}//EN`,
        url: new URL(req.originalUrl, serviceUrl).href,
        name: calendar.displayName,
        description: calendar.description,
        events: results.map((r) => ({
          id: r.id,
          timezone: TIME_ZONE,
          summary: r.name,
          description: r.description,
          allDay: r.isAllDay,
          start: r.start,
          end: r.end,
          attendees: r.attendees
            ? r.attendees
                .filter((a) => !!a.email)
                .map((a) => ({
                  email: a.email,
                }))
            : null,
        })),
      });

      iCal.serve(res, (filename as string) || `${calendar.name}.ics`);
    } catch (err) {
      next(err);
    }
  };

export const getCalendarEvents: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const calendar: CalendarEntity = req[CALENDAR_KEY];
    const { top: topValue, after, criteria: criteriaValue } = req.query;
    const top = topValue ? parseInt(topValue as string) : 10;
    const criteria = criteriaValue ? JSON.parse(criteriaValue as string) : null;
    if (criteria?.startsAfter) {
      criteria.startsAfter = DateTime.fromISO(criteria.startsAfter);
    }
    if (criteria?.endsBefore) {
      criteria.endsBefore = DateTime.fromISO(criteria.endsBefore);
    }

    const result = await calendar.getEvents(user, top, after as string, criteria);
    res.send({
      results: result.results.map(mapCalendarEvent),
      page: result.page,
    });
  } catch (err) {
    next(err);
  }
};

export const createCalendarEvent =
  (eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const { start, end, ...newEvent } = req.body;
      const event = { ...newEvent, start: DateTime.fromISO(start), end: end ? DateTime.fromISO(end) : null };
      const calendar: CalendarEntity = req[CALENDAR_KEY];

      const entity = await calendar.createEvent(user, event);
      res.send(mapCalendarEvent(entity));
      eventService.send(calendarEventCreated(user, entity));
    } catch (err) {
      next(err);
    }
  };

const EVENT_KEY = 'event';
export const getCalendarEvent: RequestHandler = async (req, _res, next) => {
  try {
    const user = req.user;
    const { id: idValue } = req.params;
    const id = parseInt(idValue);
    const calendar: CalendarEntity = req[CALENDAR_KEY];

    const event = await calendar.getEvent(user, id);
    if (!event) {
      throw new NotFoundError('Calendar event', idValue);
    }

    req[EVENT_KEY] = event;
    next();
  } catch (err) {
    next(err);
  }
};

export const retrieveCalendarEvent: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { includeAttendees } = req.query;
    const event: CalendarEventEntity = req[EVENT_KEY];

    if (includeAttendees === 'true') {
      await event.loadAttendees(user);
    }

    res.send(mapCalendarEvent(event));
  } catch (err) {
    next(err);
  }
};

export const updateCalendarEvent =
  (eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const { start, end, ...eventUpdate } = req.body;
      const update = {
        ...eventUpdate,
        start: start ? DateTime.fromISO(start as string) : null,
        end: end ? DateTime.fromISO(end as string) : null,
      };
      const event: CalendarEventEntity = req[EVENT_KEY];
      const result = await event.update(user, update);

      res.send(mapCalendarEvent(result));
      eventService.send(calendarEventUpdated(user, update, result));
    } catch (err) {
      next(err);
    }
  };

export const deleteCalendarEvent =
  (eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const event: CalendarEventEntity = req[EVENT_KEY];
      const deleted = await event.delete(user);

      res.send({ deleted });
      eventService.send(calendarEventDeleted(user, event));
    } catch (err) {
      next(err);
    }
  };

export const getEventAttendees: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const event: CalendarEventEntity = req[EVENT_KEY];

    const result = await event.loadAttendees(user);
    res.send(result.map(mapEventAttendee));
  } catch (err) {
    next(err);
  }
};

export const addEventAttendee =
  (eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const attendee = req.body;
      const event: CalendarEventEntity = req[EVENT_KEY];

      const result = await event.addAttendee(user, attendee);
      res.send(mapEventAttendee(result));
      eventService.send(calendarEventUpdated(user, { operation: 'add-attendee', attendee: result }, event));
    } catch (err) {
      next(err);
    }
  };

export const getEventAttendee: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { attendeeId: idValue } = req.params;
    const id = idValue ? parseInt(idValue) : null;
    const event: CalendarEventEntity = req[EVENT_KEY];

    const results = await event.loadAttendees(user);
    const result = results.find((r) => r.id === id);
    if (!result) {
      throw new NotFoundError('Attendee', idValue);
    }

    res.send(mapEventAttendee(result));
  } catch (err) {
    next(err);
  }
};

export const setEventAttendee =
  (eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const update = req.body;
      const { attendeeId: idValue } = req.params;
      const id = parseInt(idValue);
      const event: CalendarEventEntity = req[EVENT_KEY];

      const result = await event.updateAttendee(user, { ...update, id });

      res.send(mapEventAttendee(result));
      eventService.send(calendarEventUpdated(user, { operation: 'set-attendee', attendee: result }, event));
    } catch (err) {
      next(err);
    }
  };

export const deleteEventAttendee =
  (eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const { attendeeId: idValue } = req.params;
      const id = parseInt(idValue);
      const event: CalendarEventEntity = req[EVENT_KEY];

      const deleted = await event.deleteAttendee(user, id);

      res.send({ deleted });
      eventService.send(calendarEventUpdated(user, { operation: 'delete-attendee', attendeeId: id }, event));
    } catch (err) {
      next(err);
    }
  };

export const createCalendarRouter = ({
  logger: _logger,
  serviceId,
  eventService,
  directory,
  tenantService,
}: DateRouterProps): Router => {
  const router = Router();

  const validateNameHandler = createValidationHandler(param('name').isString().isLength({ min: 1, max: 50 }));
  const validateNameAndEventIdHandler = createValidationHandler(
    param('name').isString().isLength({ min: 1, max: 50 }),
    param('id').isInt()
  );
  const validateNameEventIdAndAttendeeIdHandler = createValidationHandler(
    param('name').isString().isLength({ min: 1, max: 50 }),
    param('id').isInt(),
    param('attendeeId').isInt()
  );

  const validateCalendarEventHandler = createValidationHandler(
    ...checkSchema(
      {
        start: { isISO8601: true },
        end: { isISO8601: true },
        name: { isString: true, isLength: { options: { min: 1, max: 50 } } },
        description: { optional: true, isString: true },
        isPublic: { optional: true, isBoolean: true },
        isAllDay: { optional: true, isBoolean: true },
      },
      ['body']
    )
  );

  const validateAttendeeHandler = createValidationHandler(
    ...checkSchema(
      {
        name: { isString: true },
        email: { isEmail: true },
      },
      ['body']
    )
  );

  router.get('/calendars', getCalendars);
  router.get('/calendars/:name', validateNameHandler, getCalendar(tenantService), (req, res) =>
    res.send(mapCalendar(req[CALENDAR_KEY]))
  );

  router.get('/calendars/:name/export', validateNameHandler, getCalendar(tenantService), exportCalendar(serviceId, directory));

  router.get('/calendars/:name/events', validateNameHandler, getCalendar(tenantService), getCalendarEvents);
  router.post(
    '/calendars/:name/events',
    validateNameHandler,
    validateCalendarEventHandler,
    getCalendar(tenantService),
    createCalendarEvent(eventService)
  );

  router.get(
    '/calendars/:name/events/:id',
    validateNameAndEventIdHandler,
    getCalendar(tenantService),
    getCalendarEvent,
    retrieveCalendarEvent
  );
  router.patch(
    '/calendars/:name/events/:id',
    validateNameAndEventIdHandler,
    validateCalendarEventHandler,
    getCalendar(tenantService),
    getCalendarEvent,
    updateCalendarEvent(eventService)
  );
  router.delete(
    '/calendars/:name/events/:id',
    validateNameAndEventIdHandler,
    getCalendar(tenantService),
    getCalendarEvent,
    deleteCalendarEvent(eventService)
  );

  router.get(
    '/calendars/:name/events/:id/attendees',
    validateNameAndEventIdHandler,
    getCalendar(tenantService),
    getCalendarEvent,
    getEventAttendees
  );
  router.post(
    '/calendars/:name/events/:id/attendees',
    validateNameAndEventIdHandler,
    validateAttendeeHandler,
    getCalendar(tenantService),
    getCalendarEvent,
    addEventAttendee(eventService)
  );

  router.get(
    '/calendars/:name/events/:id/attendees/:attendeeId',
    validateNameEventIdAndAttendeeIdHandler,
    getCalendar(tenantService),
    getCalendarEvent,
    getEventAttendee
  );
  router.put(
    '/calendars/:name/events/:id/attendees/:attendeeId',
    validateNameEventIdAndAttendeeIdHandler,
    validateAttendeeHandler,
    getCalendar(tenantService),
    getCalendarEvent,
    setEventAttendee(eventService)
  );
  router.delete(
    '/calendars/:name/events/:id/attendees/:attendeeId',
    validateNameEventIdAndAttendeeIdHandler,
    getCalendar(tenantService),
    getCalendarEvent,
    deleteEventAttendee(eventService)
  );

  return router;
};
