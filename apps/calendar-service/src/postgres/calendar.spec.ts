import { adspId } from '@abgov/adsp-service-sdk';
import { knex, Knex } from 'knex';
import { DateTime } from 'luxon';
import { CalendarEntity, CalendarEventCriteria, CalendarEventEntity } from '../calendar';
import { toDateId, toTimeId } from '../utils';
import { PostgresCalendarRepository } from './calendar';
import { DateRecord, EventRecord } from './types';

type CriteriaApplier = {
  applyEventCriteria(
    query: Knex.QueryBuilder<EventRecord, EventRecord[]>,
    criteria?: CalendarEventCriteria,
    skipTimeCriteriaForRecurring?: boolean,
  ): Knex.QueryBuilder<EventRecord, EventRecord[]>;
};

describe('PostgresCalendarRepository', () => {
  const db = knex({ client: 'pg' });
  const repository = new PostgresCalendarRepository(db) as unknown as CriteriaApplier;

  const toSql = (criteria: CalendarEventCriteria, skipTimeCriteriaForRecurring = false) =>
    repository
      .applyEventCriteria(db<EventRecord>('events AS e'), criteria, skipTimeCriteriaForRecurring)
      .toSQL()
      .toNative();

  afterAll(() => db.destroy());

  it('matches events that start at or before startsBefore', () => {
    const startsBefore = DateTime.fromISO('2026-11-02T09:30:00-07:00');

    const { sql, bindings } = toSql({ startsBefore });

    expect(sql).toContain('("e"."start_date" < $1 or ("e"."start_date" = $2 and "e"."start_time" <= $3))');
    expect(bindings).toEqual([toDateId(startsBefore), toDateId(startsBefore), toTimeId(startsBefore)]);
  });

  it('matches events that end at or after endsAfter, have no end, or are series still recurring', () => {
    const endsAfter = DateTime.fromISO('2026-11-01T08:00:00-06:00');
    const endsAfterDate = toDateId(endsAfter);

    const { sql, bindings } = toSql({ endsAfter });

    expect(sql).toContain(
      '("e"."end_date" > $1 or ("e"."end_date" = $2 and "e"."end_time" >= $3) or "e"."end_date" is null' +
        ' or ("e"."recurrence" is not null and ("e"."recurrence_end_date" is null or "e"."recurrence_end_date" >= $4)))',
    );
    expect(bindings).toEqual([endsAfterDate, endsAfterDate, toTimeId(endsAfter), endsAfterDate]);
  });

  it('matches events active on a time by comparing start and end times', () => {
    const activeOn = DateTime.fromISO('2026-11-02T09:30:00-07:00');
    const activeOnDate = toDateId(activeOn);
    const activeOnTime = toTimeId(activeOn);

    const { sql, bindings } = toSql({ activeOn });

    expect(sql).toContain(
      '("e"."start_date" < $1 or ("e"."start_date" = $2 and ("e"."start_time" <= $3 or "e"."is_all_day" = $4)))',
    );
    expect(sql).toContain(
      '("e"."end_date" > $5 or ("e"."end_date" = $6 and ("e"."end_time" >= $7 or "e"."is_all_day" = $8)) or ("e"."end_date" is null))',
    );
    expect(bindings).toEqual([
      activeOnDate,
      activeOnDate,
      activeOnTime,
      true,
      activeOnDate,
      activeOnDate,
      activeOnTime,
      true,
    ]);
  });

  it('leaves recurring series to occurrence filtering when skipping their time criteria', () => {
    const { sql } = toSql(
      {
        endsAfter: DateTime.fromISO('2026-11-01T00:00:00-06:00'),
        startsBefore: DateTime.fromISO('2026-11-02T00:00:00-07:00'),
      },
      true,
    );

    expect(sql).toContain('("e"."recurrence" is not null or (');
    expect(sql).toContain('"e"."start_time" <= $');
  });

  it('adds no time conditions without time criteria', () => {
    const { sql } = toSql({ recordId: 'record-1' });

    expect(sql).not.toContain('start_date');
    expect(sql).not.toContain('end_date');
  });

  describe('queries', () => {
    interface DriverQuery {
      sql: string;
      method?: string;
      response?: { command: string; rows: unknown[]; rowCount: number };
    }

    let database: Knex;
    let queryRepository: PostgresCalendarRepository;
    let execute: jest.SpyInstance;
    const rows = jest.fn();
    const statements = (): string[] => execute.mock.calls.map(([, query]) => (query as DriverQuery).sql);

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const calendar = { tenantId, name: 'test' } as CalendarEntity;
    const eventRecord: EventRecord = {
      tenant: tenantId.toString(),
      calendar: 'test',
      id: 1,
      record_id: 'record-1',
      context: {},
      name: 'Event',
      description: 'Event description',
      is_public: true,
      is_all_day: false,
      start_date: 20261101,
      start_time: 900,
      end_date: 20261101,
      end_time: 1000,
      recurrence: null,
      recurrence_end_date: null,
    };
    const seriesRecord: EventRecord = {
      ...eventRecord,
      id: 2,
      recurrence: { frequency: 'weekly', interval: 1, daysOfWeek: ['SU'] },
    };
    const dateRecord: DateRecord = {
      id: 20261101,
      date_value: new Date('2026-11-01'),
      day_of_week: 0,
      is_weekend: true,
      is_holiday: false,
      is_business_day: false,
      is_in_lieu_day: false,
      holiday: null,
    };

    beforeEach(() => {
      database = knex({ client: 'pg' });
      rows.mockReset().mockReturnValue([]);
      jest.spyOn(database.client, 'acquireConnection').mockResolvedValue({});
      jest.spyOn(database.client, 'releaseConnection').mockResolvedValue(undefined);
      execute = jest
        .spyOn(Object.getPrototypeOf(database.client), '_query')
        .mockImplementation(async (_connection, query: DriverQuery) => {
          const result = /^(BEGIN|COMMIT|ROLLBACK)/.test(query.sql) ? [] : rows(query);
          query.response = {
            command: query.method === 'del' ? 'DELETE' : (query.method || 'select').toUpperCase(),
            rows: Array.isArray(result) ? result : [],
            rowCount: Array.isArray(result) ? result.length : result,
          };
          return query;
        });
      queryRepository = new PostgresCalendarRepository(database);
    });

    afterEach(async () => {
      await database.destroy();
      jest.restoreAllMocks();
    });

    it('can get a date', async () => {
      rows.mockReturnValueOnce([dateRecord]);

      const result = await queryRepository.getDate(20261101);

      expect(result).toEqual(expect.objectContaining({ id: 20261101, isWeekend: true, dayOfWeek: 0 }));
    });

    it('returns null for a missing date', async () => {
      expect(await queryRepository.getDate(1)).toBeNull();
    });

    it('can get dates with criteria', async () => {
      rows.mockReturnValueOnce([dateRecord]);

      const result = await queryRepository.getDates(10, null, {
        isWeekend: true,
        isHoliday: false,
        isBusinessDay: false,
        isInLieuOfDay: false,
        min: new Date('2026-11-01'),
        max: new Date('2026-11-30'),
      });

      expect(result.results).toHaveLength(1);
      expect(statements()[0]).toContain('"id" <= ');
      expect(statements()[0]).toContain('"id" >= ');
    });

    it('can get dates without criteria', async () => {
      const result = await queryRepository.getDates(10);

      expect(result.results).toEqual([]);
    });

    it('can get calendar events and load exclusions for series', async () => {
      rows
        .mockReturnValueOnce([eventRecord, seriesRecord])
        .mockReturnValueOnce([{ tenant: tenantId.toString(), event_id: 2, occurrence_date: 20261108 }]);

      const result = await queryRepository.getCalendarEvents(calendar, 10, null, { orderBy: 'start' });

      expect(result.results.map((r) => r.id)).toEqual([1, 2]);
      expect(result.results[1].exclusions).toEqual([20261108]);
      expect(statements()[0]).toContain('order by "e"."start_date" asc');
    });

    it('can get calendar events ordered by id', async () => {
      const result = await queryRepository.getCalendarEvents(calendar, 10);

      expect(result.results).toEqual([]);
      expect(statements()[0]).toContain('order by "e"."id" asc');
    });

    it('can get calendar events in range', async () => {
      rows.mockReturnValueOnce([eventRecord]);

      const result = await queryRepository.getCalendarEventsInRange(
        calendar,
        DateTime.fromISO('2026-11-01T00:00:00-06:00'),
        DateTime.fromISO('2026-11-02T00:00:00-07:00'),
      );

      expect(result.map((r) => r.id)).toEqual([1]);
    });

    it('can get event attendees', async () => {
      rows.mockReturnValueOnce([{ tenant: tenantId.toString(), event_id: 1, id: 3, name: 'Tester', email: null }]);

      const result = await queryRepository.getEventAttendees({ calendar, id: 1 } as CalendarEventEntity);

      expect(result).toEqual([expect.objectContaining({ id: 3, name: 'Tester' })]);
    });

    it('can get a calendar event', async () => {
      rows.mockReturnValueOnce([eventRecord]);

      const result = await queryRepository.getCalendarEvent(calendar, 1);

      expect(result.name).toBe('Event');
    });

    it('can save an event and clear exclusions when it is no longer recurring', async () => {
      rows.mockReturnValueOnce([eventRecord]).mockReturnValueOnce(1);
      const entity = new CalendarEventEntity(queryRepository, calendar, {
        id: 1,
        name: 'Event',
        description: 'Event description',
        isPublic: true,
        isAllDay: false,
        start: DateTime.fromISO('2026-11-01T09:00:00-06:00'),
        end: DateTime.fromISO('2026-11-01T10:00:00-06:00'),
      });
      entity.exclusions = [20261108];

      const result = await queryRepository.save(entity);

      expect(result.id).toBe(1);
      expect(statements().some((sql) => sql.startsWith('delete from "calendar_event_exclusions"'))).toBe(true);
    });

    it('can save an attendee', async () => {
      rows.mockReturnValueOnce([{ tenant: tenantId.toString(), event_id: 1, id: 3, name: 'Tester', email: null }]);

      const result = await queryRepository.saveAttendee({ calendar, id: 1 } as CalendarEventEntity, {
        id: 3,
        name: 'Tester',
        email: null,
      });

      expect(result).toEqual(expect.objectContaining({ id: 3, name: 'Tester' }));
    });

    it('can save an exclusion', async () => {
      rows.mockReturnValueOnce([{ event_id: 1 }]);

      expect(await queryRepository.saveExclusion({ calendar, id: 1 } as CalendarEventEntity, 20261108)).toBe(true);
    });

    it('can delete an event', async () => {
      rows.mockReturnValueOnce(1);

      expect(await queryRepository.delete({ calendar, id: 1 } as CalendarEventEntity)).toBe(true);
    });

    it('can delete an attendee', async () => {
      rows.mockReturnValueOnce(0);

      expect(await queryRepository.deleteAttendee({ calendar, id: 1 } as CalendarEventEntity, 3)).toBe(false);
    });
  });
});
