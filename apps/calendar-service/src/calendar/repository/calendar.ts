import { Results } from '@core-services/core-common';
import { CalendarEntity, CalendarEventEntity } from '../model';
import { Attendee, CalendarDate, CalendarDateCriteria, CalendarEventCriteria } from '../types';

export interface CalendarRepository {
  getDate(id: number): Promise<CalendarDate>;
  getDates(top: number, after?: string, criteria?: CalendarDateCriteria): Promise<Results<CalendarDate>>;
  getCalendarEvents(
    calendar: CalendarEntity,
    top: number,
    after?: string,
    criteria?: CalendarEventCriteria
  ): Promise<Results<CalendarEventEntity>>;
  getCalendarEvent(calendar: CalendarEntity, id: number): Promise<CalendarEventEntity>;

  getEventAttendees(event: CalendarEventEntity): Promise<Attendee[]>;

  save(entity: CalendarEventEntity): Promise<CalendarEventEntity>;
  saveAttendee(event: CalendarEventEntity, attendee: Attendee): Promise<Attendee>;
  delete(entity: CalendarEventEntity): Promise<boolean>;
  deleteAttendee(event: CalendarEventEntity, attendeeId: number): Promise<boolean>;
}
