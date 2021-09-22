import { decodeAfter, encodeNext, Results } from '@core-services/core-common';
import * as knex from 'knex';
import { CalendarDate, CalendarDateCriteria, CalendarRepository, DayOfWeek } from '../calendar';
import { DateRecord } from './types';

export class PostgresCalendarRepository implements CalendarRepository {
  constructor(private knex: knex) {}

  private mapRecord(record: DateRecord): CalendarDate {
    return record
      ? {
          id: record.id,
          date: record.date_value,
          dayOfWeek: record.day_of_week,
          dayOfWeekNumber: record.day_of_week,
          isWeekend: record.is_weekend,
          isHoliday: record.is_holiday,
          isBusinessDay: record.is_business_day,
          holiday: record.holiday,
        }
      : null;
  }

  async getDate(id: number): Promise<CalendarDate> {
    const [record] = await this.knex<DateRecord>('calendar_dates').limit(1).where({ id });

    return this.mapRecord(record);
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
      results: rows.map((r) => this.mapRecord(r)),
      page: {
        after,
        next: encodeNext(rows.length, top, skip),
        size: rows.length,
      },
    };
  }
}
