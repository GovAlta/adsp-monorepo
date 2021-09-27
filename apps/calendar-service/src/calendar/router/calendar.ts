import { AdspId } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { ICalCalendar } from 'ical-generator';
import { DateTime } from 'luxon';
import { Logger } from 'winston';
import { environment } from '../../environments/environment';
import { CalendarEntity } from '../model';
import { CalendarEventEntity } from '../model/event';
import { CalendarRepository } from '../repository';
import { Attendee, CalendarServiceConfiguration } from '../types';

interface DateRouterProps {
  serviceId: AdspId;
  logger: Logger;
  repository: CalendarRepository;
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
export const getCalendar: RequestHandler = async (req, _res, next) => {
  try {
    const { name } = req.params;
    const [calendars] = await req.getConfiguration<CalendarServiceConfiguration>();

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

export const exportCalendar =
  (serviceId: AdspId): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const calendar: CalendarEntity = req[CALENDAR_KEY];
      const { top: topValue, after, filename } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;

      const { results } = await calendar.getEvents(user, top, after as string);
      for (const result of results) {
        await result.loadAttendees();
      }
      const iCal = new ICalCalendar({
        prodId: `//Government of Alberta//${serviceId}//EN`,
        name: calendar.name,
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
    const { top: topValue, after } = req.query;
    const top = topValue ? parseInt(topValue as string) : 10;

    const result = await calendar.getEvents(user, top, after as string);
    res.send({
      results: result.results.map(mapCalendarEvent),
      page: result.page,
    });
  } catch (err) {
    next(err);
  }
};

export const createCalendarEvent: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { start, end, ...newEvent } = req.body;
    const event = { ...newEvent, start: DateTime.fromISO(start), end: end ? DateTime.fromISO(end) : null };
    const calendar: CalendarEntity = req[CALENDAR_KEY];
    const entity = await calendar.createEvent(user, event);
    res.send(mapCalendarEvent(entity));
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

export const updateCalendarEvent: RequestHandler = async (req, res, next) => {
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
  } catch (err) {
    next(err);
  }
};

export const deleteCalendarEvent: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const event: CalendarEventEntity = req[EVENT_KEY];
    const deleted = await event.delete(user);

    res.send({ deleted });
  } catch (err) {
    next(err);
  }
};

export const getEventAttendees: RequestHandler = async (req, res, next) => {
  try {
    const event: CalendarEventEntity = req[EVENT_KEY];

    const result = await event.loadAttendees();
    res.send(result.map(mapEventAttendee));
  } catch (err) {
    next(err);
  }
};

export const addEventAttendee: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const attendee = req.body;
    const event: CalendarEventEntity = req[EVENT_KEY];

    const result = await event.addAttendee(user, attendee);
    res.send(mapEventAttendee(result));
  } catch (err) {
    next(err);
  }
};

export const getEventAttendee: RequestHandler = async (req, res, next) => {
  try {
    const { attendeeId: idValue } = req.params;
    const id = idValue ? parseInt(idValue) : null;
    const event: CalendarEventEntity = req[EVENT_KEY];

    const results = await event.loadAttendees();
    const result = results.find((r) => r.id === id);
    if (!result) {
      throw new NotFoundError('Attendee', idValue);
    }

    res.send(mapEventAttendee(result));
  } catch (err) {
    next(err);
  }
};

export const updateEventAttendee: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const update = req.body;
    const { attendeeId: idValue } = req.params;
    const id = parseInt(idValue);
    const event: CalendarEventEntity = req[EVENT_KEY];

    const result = await event.updateAttendee(user, { ...update, id });

    res.send(mapEventAttendee(result));
  } catch (err) {
    next(err);
  }
};

export const deleteEventAttendee: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { attendeeId: idValue } = req.params;
    const id = parseInt(idValue);
    const event: CalendarEventEntity = req[EVENT_KEY];

    const deleted = await event.deleteAttendee(user, id);

    res.send({ deleted });
  } catch (err) {
    next(err);
  }
};

export const createCalendarRouter = ({ logger: _logger, serviceId }: DateRouterProps): Router => {
  const router = Router();

  router.get('/calendars', getCalendars);
  router.get('/calendars/:name', getCalendar, (req, res) => res.send(mapCalendar(req[CALENDAR_KEY])));

  router.get('/calendars/:name/export', getCalendar, exportCalendar(serviceId));

  router.get('/calendars/:name/events', getCalendar, getCalendarEvents);
  router.post('/calendars/:name/events', getCalendar, createCalendarEvent);

  router.get('/calendars/:name/events/:id', getCalendar, getCalendarEvent, async (req, res) => {
    const { includeAttendees } = req.query;
    const event: CalendarEventEntity = req[EVENT_KEY];

    if (includeAttendees !== undefined) {
      await event.loadAttendees();
    }

    res.send(mapCalendarEvent(event));
  });
  router.patch('/calendars/:name/events/:id', getCalendar, getCalendarEvent, updateCalendarEvent);
  router.delete('/calendars/:name/events/:id', getCalendar, getCalendarEvent, deleteCalendarEvent);

  router.get('/calendars/:name/events/:id/attendees', getCalendar, getCalendarEvent, getEventAttendees);
  router.post('/calendars/:name/events/:id/attendees', getCalendar, getCalendarEvent, addEventAttendee);

  router.get('/calendars/:name/events/:id/attendees/:attendeeId', getCalendar, getCalendarEvent, getEventAttendee);
  router.patch('/calendars/:name/events/:id/attendees/:attendeeId', getCalendar, getCalendarEvent, updateEventAttendee);
  router.delete('/calendars/:name/events/:id/attendees/:attendeeId', getCalendar, getCalendarEvent);

  return router;
};
