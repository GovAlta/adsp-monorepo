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
          isInLieuOfDay: record.is_in_lieu_day,
        }
      : null;
  }

  private mapEventRecord(calendar: CalendarEntity, record: EventRecord): CalendarEventEntity {
    return record
      ? new CalendarEventEntity(this, calendar, {
          id: record.id,
          recordId: record.record_id,
          context: record.context,
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

      if (criteria.isInLieuOfDay != null) {
        queryCriteria.is_in_lieu_day = criteria.isInLieuOfDay;
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
    // to determine whether there is next page, we need to query one more.
    const topChecked = top + 1;

    let query = this.knex<EventRecord>('calendar_events AS e')
      .select('e.*')
      .distinctOn('e.id')
      .offset(skip)
      .limit(topChecked)
      .where('e.tenant', '=', calendar.tenantId.toString())
      .andWhere('e.calendar', '=', calendar.name);

    if (criteria) {
      const queryCriteria: Record<string, unknown> = {};

      if (criteria.isPublic != null) {
        queryCriteria.is_public = criteria.isPublic;
      }

      if (criteria.recordId) {
        queryCriteria.record_id = criteria.recordId;
      }

      query = query.andWhere(queryCriteria);

      if (criteria.context) {
        query.whereRaw(`context @> ?::jsonb`, [JSON.stringify(criteria.context)]);
      }

      if (criteria.startsAfter) {
        // Where e.start_date is greater than startsAfterDate and time is greater or equal.
        const startsAfterDate = toDateId(criteria.startsAfter);
        const startsAfterTime = toTimeId(criteria.startsAfter);

        query = query.andWhere((query) => {
          query.where('e.start_date', '>', startsAfterDate).orWhere((q) => {
            q.where('e.start_date', '=', startsAfterDate).andWhere('e.start_time', '>=', startsAfterTime);
          });
        });
      }

      if (criteria.endsBefore) {
        // Where e.end_date is less than endsBeforeDate and time is lesser or equal.
        const endsBeforeDate = toDateId(criteria.endsBefore);
        const endsBeforeTime = toTimeId(criteria.endsBefore);

        query = query.andWhere((query) => {
          query.where('e.end_date', '<', endsBeforeDate).orWhere((q) => {
            q.where('e.end_date', '=', endsBeforeDate).andWhere('e.end_time', '<=', endsBeforeTime);
          });
        });
      }

      if (criteria.activeOn) {
        // Where date and time is between start and end.
        const activeOnDate = toDateId(criteria.activeOn);
        const activeOnTime = toTimeId(criteria.activeOn);

        query = query.andWhere((query) =>
          query
            .where('e.start_date', '<', activeOnDate)
            .orWhere((query) =>
              query
                .where('e.start_date', '=', activeOnDate)
                .andWhere((query) => query.where('e.start_time', '<=', activeOnTime).orWhere('e.is_all_day', true))
            )
        );
        query = query.andWhere((query) =>
          query
            .andWhere('e.end_date', '>', activeOnDate)
            .orWhere((query) =>
              query
                .where('e.end_date', '=', activeOnDate)
                .andWhere((query) => query.where('e.end_date', '>=', activeOnTime).orWhere('e.is_all_day', true))
            )
            .orWhere((query) => query.whereNull('e.end_date'))
        );
      }

      if (criteria.attendeeCriteria) {
        query.join('attendees AS a', 'e.id', '=', 'a.event_id');
        if (criteria.attendeeCriteria.emailEquals !== undefined) {
          if (criteria.attendeeCriteria.emailEquals === null) {
            query.whereNull('a.email');
          } else {
            query.where('a.email', '=', criteria.attendeeCriteria.emailEquals);
          }
        }

        if (criteria.attendeeCriteria.nameEquals !== undefined) {
          if (criteria.attendeeCriteria.nameEquals === null) {
            query.whereNull('a.name');
          } else {
            query.where('a.name', '=', criteria.attendeeCriteria.nameEquals);
          }
        }
      }
    }

    const rows = await query.orderBy('e.id', 'asc');

    return {
      results: rows.map((r) => this.mapEventRecord(calendar, r)).slice(0, top),
      page: {
        after,
        next: encodeNext(rows.length, topChecked, skip - 1),
        size: rows.length > top ? top : rows.length,
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
