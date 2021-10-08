import { decodeAfter, encodeNext, Results } from '@core-services/core-common';
import { Knex } from 'knex';
import {
  Attendee,
  CalendarDate,
  CalendarDateCriteria,
  CalendarEventCriteria,
  CalendarRepository,
  CalendarEntity,
  CalendarEventEntity,
} from '../calendar';
import { AttendeeRecord, DateRecord, EventRecord } from './types';
import { fromDateAndTimeIds, toDateId, toTimeId } from '../utils';

export class PostgresCalendarRepository implements CalendarRepository {
  constructor(private knex: Knex) {}

  private mapDateRecord(record: DateRecord): CalendarDate {
    return record
      ? {
          id: record.id,
          date: record.date_value,
          dayOfWeek: record.day_of_week,
          isWeekend: record.is_weekend,
          isHoliday: record.is_holiday,
          isBusinessDay: record.is_business_day,
          holiday: record.holiday,
        }
      : null;
  }

  private mapEventRecord(calendar: CalendarEntity, record: EventRecord): CalendarEventEntity {
    return record
      ? new CalendarEventEntity(this, calendar, {
          id: record.id,
          name: record.name,
          description: record.description,
          isPublic: record.is_public,
          isAllDay: record.is_all_day,
          start: fromDateAndTimeIds(record.start_date, record.start_time),
          end: fromDateAndTimeIds(record.end_date, record.end_time),
        })
      : null;
  }

  private mapAttendeeRecord({ event_id: _event_id, ...attendee }: AttendeeRecord): Attendee {
    return attendee;
  }

  async getDate(id: number): Promise<CalendarDate> {
    const [record] = await this.knex<DateRecord>('calendar_dates').limit(1).where({ id });

    return this.mapDateRecord(record);
  }

  async getDates(top: number, after?: string, criteria?: CalendarDateCriteria): Promise<Results<CalendarDate>> {
    const skip = decodeAfter(after);

    let query = this.knex<DateRecord>('calendar_dates');
    query = query.offset(skip).limit(top);

    if (criteria) {
      const queryCriteria: Record<string, unknown> = {};

      if (criteria.isWeekend != null) {
        queryCriteria.is_weekend = criteria.isWeekend;
      }

      if (criteria.isHoliday != null) {
        queryCriteria.is_holiday = criteria.isHoliday;
      }

      if (criteria.isBusinessDay != null) {
        queryCriteria.is_business_day = criteria.isBusinessDay;
      }

      query.where(queryCriteria);

      if (criteria.max) {
        query = query.where('id', '<=', criteria.max);
      }

      if (criteria.min) {
        query = query.where('id', '>=', criteria.min);
      }
    }

    const rows = await query.orderBy('id', 'asc');

    return {
      results: rows.map((r) => this.mapDateRecord(r)),
      page: {
        after,
        next: encodeNext(rows.length, top, skip),
        size: rows.length,
      },
    };
  }

  async getCalendarEvents(
    calendar: CalendarEntity,
    top: number,
    after?: string,
    criteria?: CalendarEventCriteria
  ): Promise<Results<CalendarEventEntity>> {
    const skip = decodeAfter(after);

    let query = this.knex<EventRecord>('calendar_events');
    query = query.offset(skip).limit(top);
    query.where({
      tenant: calendar.tenantId.toString(),
      calendar: calendar.name,
    });

    if (criteria) {
      const queryCriteria: Record<string, unknown> = {};

      if (criteria.isPublic != null) {
        queryCriteria.is_public = criteria.isPublic;
      }

      query.where(queryCriteria);

      if (criteria.startsAfter) {
        // Where date is greater or date is equal and time is greater or equal.
        const afterDate = toDateId(criteria.startsAfter);
        const afterTime = toTimeId(criteria.startsAfter);
        query = query.where('start_date', '>', afterDate).orWhere((query) => {
          query.where('start_date', '=', afterDate).andWhere('start_time', '>=', afterTime);
        });
      }

      if (criteria.endsBefore) {
        // Where date is less or date is equal and time is lesser or equal.
        const beforeDate = toDateId(criteria.endsBefore);
        const beforeTime = toTimeId(criteria.endsBefore);
        query = query.where('end_date', '<', beforeDate).orWhere((query) => {
          query.where('end_date', '=', beforeDate).andWhere('end_date', '<=', beforeTime);
        });
      }
    }

    const rows = await query.orderBy('id', 'asc');

    return {
      results: rows.map((r) => this.mapEventRecord(calendar, r)),
      page: {
        after,
        next: encodeNext(rows.length, top, skip),
        size: rows.length,
      },
    };
  }

  async getEventAttendees(event: CalendarEventEntity): Promise<Attendee[]> {
    const query = this.knex<AttendeeRecord>('attendees');
    query.where({
      tenant: event.calendar.tenantId.toString(),
      event_id: event.id,
    });

    const rows = await query.orderBy('id', 'asc');

    return rows.map(this.mapAttendeeRecord);
  }

  async getCalendarEvent(calendar: CalendarEntity, id: number): Promise<CalendarEventEntity> {
    const [record] = await this.knex<EventRecord>('calendar_events').limit(1).where({
      tenant: calendar.tenantId.toString(),
      id,
      calendar: calendar.name,
    });

    return this.mapEventRecord(calendar, record);
  }

  async save(entity: CalendarEventEntity): Promise<CalendarEventEntity> {
    const tenant = entity.calendar.tenantId.toString();
    const record = await this.knex.transaction(async (ts) => {
      const [row] = await ts<EventRecord>('calendar_events')
        .insert({
          tenant,
          id: entity.id,
          calendar: entity.calendar.name,
          name: entity.name,
          description: entity.description,
          is_public: entity.isPublic,
          is_all_day: entity.isAllDay,
          start_date: toDateId(entity.start),
          start_time: toTimeId(entity.start),
          end_date: toDateId(entity.end),
          end_time: toTimeId(entity.end),
        })
        .onConflict(['tenant', 'id'])
        .merge()
        .returning('*');

      return row;
    });

    return this.mapEventRecord(entity.calendar, record);
  }

  async saveAttendee(event: CalendarEventEntity, attendee: Attendee): Promise<Attendee> {
    const tenant = event.calendar.tenantId.toString();
    const record = await this.knex.transaction(async (ts) => {
      const [row] = await ts<AttendeeRecord>('attendees')
        .insert({
          tenant,
          event_id: event.id,
          id: attendee.id,
          name: attendee.name,
          email: attendee.email,
        })
        .onConflict(['tenant', 'event_id', 'id'])
        .merge()
        .returning('*');

      return row;
    });

    return this.mapAttendeeRecord(record);
  }

  async delete(entity: CalendarEventEntity): Promise<boolean> {
    const result = await this.knex<EventRecord>('calendar_events')
      .limit(1)
      .where({
        tenant: entity.calendar.tenantId.toString(),
        calendar: entity.calendar.name,
        id: entity.id,
      })

      .delete();

    return result === 1;
  }

  async deleteAttendee(event: CalendarEventEntity, id: number): Promise<boolean> {
    const result = await this.knex<AttendeeRecord>('attendees')
      .limit(1)
      .where({
        tenant: event.calendar.tenantId.toString(),
        event_id: event.id,
        id,
      })
      .delete();

    return result === 1;
  }
}
