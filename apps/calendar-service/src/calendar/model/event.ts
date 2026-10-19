import { UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, New, NotFoundError, Update } from '@core-services/core-common';
import { DateTime } from 'luxon';
import { toDateId } from '../../utils';
import { CalendarEntity } from './calendar';
import { CalendarRepository } from '../repository';
import {
  expandOccurrences,
  findOccurrence,
  normalizeRecurrence,
  RecurrenceInstance,
  toRecurrenceId,
} from '../recurrence';
import { Attendee, CalendarEvent, EventRecurrence } from '../types';

export interface CalendarEventOccurrence extends RecurrenceInstance {
  event: CalendarEventEntity;
}

export type CalendarEventInstance = CalendarEventEntity | CalendarEventOccurrence;

export function isEventOccurrence(value: CalendarEventInstance): value is CalendarEventOccurrence {
  return 'recurrenceId' in value;
}

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
  recurrence?: EventRecurrence;
  // Local dates (yyyyMMdd) of cancelled occurrences.
  exclusions: number[] = [];
  attendees: Attendee[];

  constructor(
    private repository: CalendarRepository,
    public calendar: CalendarEntity,
    event: CalendarEvent | New<CalendarEvent>,
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
      this.recurrence = event.recurrence || null;
    } else {
      if (this.end && this.end.valueOf() < this.start.valueOf()) {
        throw new InvalidOperationError('End of event must be after start of event.');
      }
      this.recurrence = event.recurrence ? normalizeRecurrence(this.start, event.recurrence) : null;
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

    if ('recurrence' in update) {
      this.recurrence = update.recurrence || null;
    }

    if (this.end && this.end.valueOf() < this.start.valueOf()) {
      throw new InvalidOperationError('End of event must be after start of event.');
    }

    // Re-validate against the (possibly changed) start, e.g. weekly days must include the start day.
    if (this.recurrence) {
      this.recurrence = normalizeRecurrence(this.start, this.recurrence);
    }

    return this.repository.save(this);
  }

  getOccurrences(from: DateTime, to: DateTime): CalendarEventOccurrence[] {
    return expandOccurrences(this, from, to).map((instance) => ({ ...instance, event: this }));
  }

  getExcludedRecurrenceIds(): DateTime[] {
    return this.exclusions.map((occurrenceDate) => toRecurrenceId(this.start, occurrenceDate));
  }

  async excludeOccurrence(user: User, occurrence: DateTime): Promise<{ deleted: boolean; recurrenceId: DateTime }> {
    if (!this.calendar.canUpdateEvent(user)) {
      throw new UnauthorizedUserError('cancel calendar event occurrence', user);
    }

    if (!this.recurrence) {
      throw new InvalidOperationError('Calendar event is not recurring.');
    }

    const recurrenceId = findOccurrence(this, occurrence);
    if (!recurrenceId) {
      throw new NotFoundError('Calendar event occurrence', occurrence.toISODate());
    }

    const occurrenceDate = toDateId(recurrenceId);
    const deleted = await this.repository.saveExclusion(this, occurrenceDate);
    if (deleted) {
      this.exclusions = [...this.exclusions, occurrenceDate].sort((a, b) => a - b);
    }

    return { deleted, recurrenceId };
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
