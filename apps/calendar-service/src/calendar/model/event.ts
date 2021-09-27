import { UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, New, Update } from '@core-services/core-common';
import { DateTime } from 'luxon';
import { CalendarEntity } from './calendar';
import { CalendarRepository } from '../repository';
import { Attendee, CalendarEvent } from '../types';

export class CalendarEventEntity implements CalendarEvent {
  id: number;
  name: string;
  description: string;
  start: DateTime;
  end: DateTime;
  isPublic: boolean;
  isAllDay: boolean;
  attendees: Attendee[];

  constructor(
    private repository: CalendarRepository,
    public calendar: CalendarEntity,
    event: CalendarEvent | New<CalendarEvent>
  ) {
    this.name = event.name;
    this.description = event.description;
    this.start = event.start;
    this.end = event.end;
    this.isPublic = event.isPublic || false;
    this.isAllDay = event.isAllDay || false;

    const record = event as CalendarEvent;
    if (record.id) {
      this.id = record.id;
    }
  }

  update(user: User, update: Update<CalendarEvent>): Promise<CalendarEventEntity> {
    if (!this.calendar.canUpdateEvent(user)) {
      throw new UnauthorizedUserError('update calendar event', user);
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.description) {
      this.description = update.description;
    }

    if (update.isPublic) {
      this.isPublic = update.isPublic;
    }

    if (update.isAllDay) {
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

  async loadAttendees(): Promise<Attendee[]> {
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
