import { UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, New, Update } from '@core-services/core-common';
import { DateTime } from 'luxon';
import { CalendarEntity } from './calendar';
import { CalendarRepository } from '../repository';
import { Attendee, CalendarEvent } from '../types';

export class CalendarEventEntity implements CalendarEvent {
  id: number;
  recordId: string;
  context: Record<string, boolean | string | number>;
  name: string;
  description: string;
  start: DateTime;
  end?: DateTime;
  isPublic: boolean;
  isAllDay: boolean;
  attendees: Attendee[];

  constructor(
    private repository: CalendarRepository,
    public calendar: CalendarEntity,
    event: CalendarEvent | New<CalendarEvent>
  ) {
    this.recordId = event.recordId;
    this.context = event.context;
    this.name = event.name;
    this.description = event.description;
    this.start = event.start;
    this.end = event.end;
    this.isPublic = event.isPublic || false;
    this.isAllDay = event.isAllDay || false;

    const record = event as CalendarEvent;
    if (record.id) {
      this.id = record.id;
    } else {
      if (this.end && this.end.valueOf() < this.start.valueOf()) {
        throw new InvalidOperationError('End of event must be after start of event.');
      }
    }
  }

  update(user: User, update: Update<CalendarEvent>): Promise<CalendarEventEntity> {
    if (!this.calendar.canUpdateEvent(user)) {
      throw new UnauthorizedUserError('update calendar event', user);
    }

    if (update.context) {
      this.context = update.context;
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.description) {
      this.description = update.description;
    }

    if ('isPublic' in update) {
      this.isPublic = update.isPublic;
    }

    if ('isAllDay' in update) {
      this.isAllDay = update.isAllDay;
    }

    if (update.start) {
      this.start = update.start;
    }

    if (update.end) {
      this.end = update.end;
    }

    if (this.end && this.end.valueOf() < this.start.valueOf()) {
      throw new InvalidOperationError('End of event must be after start of event.');
    }

    return this.repository.save(this);
  }

  delete(user: User): Promise<boolean> {
    if (!this.calendar.canUpdateEvent(user)) {
      throw new UnauthorizedUserError('delete calendar event', user);
    }

    return this.repository.delete(this);
  }

  async loadAttendees(user: User): Promise<Attendee[]> {
    // User must have private access to events to get the attendees.
    if (!this.calendar.canAccessPrivateEvent(user)) {
      throw new UnauthorizedUserError('Access event attendees', user);
    }

    this.attendees = await this.repository.getEventAttendees(this);
    return this.attendees;
  }

  addAttendee(user: User, attendee: New<Attendee>): Promise<Attendee> {
    if (!this.calendar.canUpdateEvent(user)) {
      throw new UnauthorizedUserError('update calendar event', user);
    }

    return this.repository.saveAttendee(this, { ...attendee, id: undefined });
  }

  updateAttendee(user: User, attendee: Attendee): Promise<Attendee> {
    if (!this.calendar.canUpdateEvent(user)) {
      throw new UnauthorizedUserError('update calendar event', user);
    }

    return this.repository.saveAttendee(this, attendee);
  }

  deleteAttendee(user: User, id: number): Promise<boolean> {
    if (!this.calendar.canUpdateEvent(user)) {
      throw new UnauthorizedUserError('update calendar event', user);
    }

    return this.repository.deleteAttendee(this, id);
  }
}
