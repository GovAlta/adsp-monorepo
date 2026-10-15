import { InvalidOperationError } from '@core-services/core-common';
import { DateTime } from 'luxon';
import {
  expandOccurrences,
  findOccurrence,
  getRecurrenceEndDate,
  normalizeRecurrence,
  RecurrenceInstance,
  RecurringSchedule,
  toRecurrenceId,
} from './recurrence';
import { EventRecurrence } from './types';

describe('recurrence', () => {
  // Use a Mountain zone that still observes DST so the DST cases keep their coverage regardless of the
  // tzdata version; newer tzdata has America/Edmonton on permanent UTC-6 from Nov 2026.
  const zone = 'America/Denver';
  const at = (value: string) => DateTime.fromISO(value, { zone });
  const toIso = (value: DateTime) => value?.toISO({ suppressMilliseconds: true });
  const starts = (instances: RecurrenceInstance[]) => instances.map(({ start }) => toIso(start));

  const teamMeeting: RecurringSchedule = {
    start: at('2026-09-29T10:00'),
    end: at('2026-09-29T11:00'),
    isAllDay: false,
    recurrence: { frequency: 'weekly', interval: 1, daysOfWeek: ['TU'], end: { until: '2026-12-15' } },
    exclusions: [20261013],
  };

  describe('normalizeRecurrence', () => {
    const tuesday = at('2026-09-29T10:00');

    it('can apply defaults', () => {
      expect(normalizeRecurrence(tuesday, { frequency: 'weekly' }, zone)).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: ['TU'],
      });
      expect(normalizeRecurrence(tuesday, { frequency: 'daily', interval: 2 }, zone)).toEqual({
        frequency: 'daily',
        interval: 2,
      });
    });

    it('can sort days of week', () => {
      const result = normalizeRecurrence(tuesday, { frequency: 'weekly', daysOfWeek: ['FR', 'TU', 'MO'] }, zone);
      expect(result.daysOfWeek).toEqual(['MO', 'TU', 'FR']);
    });

    it('can normalize until date-time to the local date', () => {
      const result = normalizeRecurrence(tuesday, { frequency: 'daily', end: { until: '2026-12-16T05:00:00Z' } }, zone);
      expect(result.end).toEqual({ until: '2026-12-15' });
    });

    it('can keep count', () => {
      const result = normalizeRecurrence(tuesday, { frequency: 'monthly', end: { count: 10 } }, zone);
      expect(result.end).toEqual({ count: 10 });
    });

    it('can treat empty end as no end', () => {
      const result = normalizeRecurrence(tuesday, { frequency: 'yearly', end: {} }, zone);
      expect(result).toEqual({ frequency: 'yearly', interval: 1 });
    });

    it.each([
      ['unknown frequency', { frequency: 'hourly' }],
      ['interval of zero', { frequency: 'daily', interval: 0 }],
      ['interval over maximum', { frequency: 'daily', interval: 100 }],
      ['fractional interval', { frequency: 'daily', interval: 1.5 }],
      ['days of week on daily', { frequency: 'daily', daysOfWeek: ['TU'] }],
      ['empty days of week', { frequency: 'weekly', daysOfWeek: [] }],
      ['unknown day of week', { frequency: 'weekly', daysOfWeek: ['TU', 'XX'] }],
      ['duplicate days of week', { frequency: 'weekly', daysOfWeek: ['TU', 'TU'] }],
      ['days of week without start day', { frequency: 'weekly', daysOfWeek: ['WE'] }],
      ['until and count', { frequency: 'daily', end: { until: '2026-12-15', count: 3 } }],
      ['count of zero', { frequency: 'daily', end: { count: 0 } }],
      ['count over maximum', { frequency: 'daily', end: { count: 1001 } }],
      ['invalid until', { frequency: 'daily', end: { until: 'not-a-date' } }],
      ['until before start', { frequency: 'daily', end: { until: '2026-09-28' } }],
      ['end that is not an object', { frequency: 'daily', end: 'soon' }],
      ['exclusions in request', { frequency: 'daily', exclusions: ['2026-10-13'] }],
    ])('can throw for %s', (_, recurrence) => {
      expect(() => normalizeRecurrence(tuesday, recurrence as unknown as EventRecurrence, zone)).toThrow(
        InvalidOperationError,
      );
    });
  });

  describe('expandOccurrences', () => {
    it.each<[string, RecurringSchedule, string, string, string[]]>([
      [
        'daily',
        { start: at('2026-10-01T09:00'), end: at('2026-10-01T09:30'), recurrence: { frequency: 'daily' } },
        '2026-10-01T00:00',
        '2026-10-03T23:59',
        ['2026-10-01T09:00:00-06:00', '2026-10-02T09:00:00-06:00', '2026-10-03T09:00:00-06:00'],
      ],
      [
        'every 3 days',
        { start: at('2026-10-01T09:00'), end: at('2026-10-01T09:30'), recurrence: { frequency: 'daily', interval: 3 } },
        '2026-10-01T00:00',
        '2026-10-12T23:59',
        [
          '2026-10-01T09:00:00-06:00',
          '2026-10-04T09:00:00-06:00',
          '2026-10-07T09:00:00-06:00',
          '2026-10-10T09:00:00-06:00',
        ],
      ],
      [
        'weekly on Tuesday with an exclusion (ticket example)',
        teamMeeting,
        '2026-10-01T00:00',
        '2026-10-31T23:59',
        ['2026-10-06T10:00:00-06:00', '2026-10-20T10:00:00-06:00', '2026-10-27T10:00:00-06:00'],
      ],
      [
        'weekly on Monday, Wednesday, and Friday',
        {
          start: at('2026-10-05T08:00'),
          end: at('2026-10-05T08:15'),
          recurrence: { frequency: 'weekly', daysOfWeek: ['MO', 'WE', 'FR'] },
        },
        '2026-10-05T00:00',
        '2026-10-11T23:59',
        ['2026-10-05T08:00:00-06:00', '2026-10-07T08:00:00-06:00', '2026-10-09T08:00:00-06:00'],
      ],
      [
        'every 2 weeks on Monday and Thursday from a Thursday start',
        {
          start: at('2026-10-08T08:00'),
          end: at('2026-10-08T09:00'),
          recurrence: { frequency: 'weekly', interval: 2, daysOfWeek: ['MO', 'TH'] },
        },
        '2026-10-01T00:00',
        '2026-11-01T23:59',
        ['2026-10-08T08:00:00-06:00', '2026-10-19T08:00:00-06:00', '2026-10-22T08:00:00-06:00'],
      ],
      [
        'monthly on the 15th across DST start',
        { start: at('2026-01-15T09:00'), end: at('2026-01-15T10:00'), recurrence: { frequency: 'monthly' } },
        '2026-01-01T00:00',
        '2026-04-30T23:59',
        [
          '2026-01-15T09:00:00-07:00',
          '2026-02-15T09:00:00-07:00',
          '2026-03-15T09:00:00-06:00',
          '2026-04-15T09:00:00-06:00',
        ],
      ],
      [
        'monthly on the 31st skipping short months',
        { start: at('2026-01-31T09:00'), end: at('2026-01-31T10:00'), recurrence: { frequency: 'monthly' } },
        '2026-01-01T00:00',
        '2026-07-31T23:59',
        [
          '2026-01-31T09:00:00-07:00',
          '2026-03-31T09:00:00-06:00',
          '2026-05-31T09:00:00-06:00',
          '2026-07-31T09:00:00-06:00',
        ],
      ],
      [
        'yearly',
        { start: at('2026-07-01T12:00'), end: at('2026-07-01T13:00'), recurrence: { frequency: 'yearly' } },
        '2026-01-01T00:00',
        '2028-12-31T23:59',
        ['2026-07-01T12:00:00-06:00', '2027-07-01T12:00:00-06:00', '2028-07-01T12:00:00-06:00'],
      ],
      [
        'yearly on February 29 in leap years only',
        { start: at('2028-02-29T12:00'), end: at('2028-02-29T13:00'), recurrence: { frequency: 'yearly' } },
        '2028-01-01T00:00',
        '2033-12-31T23:59',
        ['2028-02-29T12:00:00-07:00', '2032-02-29T12:00:00-07:00'],
      ],
      [
        'count that includes excluded occurrences',
        {
          start: at('2026-10-01T09:00'),
          end: at('2026-10-01T10:00'),
          recurrence: { frequency: 'daily', end: { count: 5 } },
          exclusions: [20261003],
        },
        '2026-10-01T00:00',
        '2026-10-31T23:59',
        [
          '2026-10-01T09:00:00-06:00',
          '2026-10-02T09:00:00-06:00',
          '2026-10-04T09:00:00-06:00',
          '2026-10-05T09:00:00-06:00',
        ],
      ],
      [
        'inclusive until',
        {
          start: at('2026-10-01T09:00'),
          end: at('2026-10-01T10:00'),
          recurrence: { frequency: 'daily', end: { until: '2026-10-03' } },
        },
        '2026-10-01T00:00',
        '2026-10-31T23:59',
        ['2026-10-01T09:00:00-06:00', '2026-10-02T09:00:00-06:00', '2026-10-03T09:00:00-06:00'],
      ],
      [
        'no end far from the start',
        {
          start: at('2026-01-06T10:00'),
          end: at('2026-01-06T11:00'),
          recurrence: { frequency: 'weekly', daysOfWeek: ['TU'] },
        },
        '2030-01-01T00:00',
        '2030-01-14T23:59',
        ['2030-01-01T10:00:00-07:00', '2030-01-08T10:00:00-07:00'],
      ],
      [
        'multi-day occurrence starting before the range',
        {
          start: at('2026-10-05T09:00'),
          end: at('2026-10-07T17:00'),
          recurrence: { frequency: 'weekly', daysOfWeek: ['MO'] },
        },
        '2026-10-13T00:00',
        '2026-10-14T23:59',
        ['2026-10-12T09:00:00-06:00'],
      ],
      [
        'occurrences touching both range boundaries',
        { start: at('2026-10-01T09:00'), end: at('2026-10-01T10:00'), recurrence: { frequency: 'daily' } },
        '2026-10-02T10:00',
        '2026-10-03T09:00',
        ['2026-10-02T09:00:00-06:00', '2026-10-03T09:00:00-06:00'],
      ],
      ['series that ends before the range', teamMeeting, '2026-12-16T00:00', '2026-12-31T23:59', []],
      [
        'occurrences without an end as instants',
        { start: at('2026-10-01T09:00'), recurrence: { frequency: 'daily' } },
        '2026-10-03T00:00',
        '2026-10-04T23:59',
        ['2026-10-03T09:00:00-06:00', '2026-10-04T09:00:00-06:00'],
      ],
      [
        'weekly across DST end keeping 10:00 Mountain',
        { start: at('2026-10-27T10:00'), end: at('2026-10-27T11:00'), recurrence: { frequency: 'weekly' } },
        '2026-10-27T00:00',
        '2026-11-10T23:59',
        ['2026-10-27T10:00:00-06:00', '2026-11-03T10:00:00-07:00', '2026-11-10T10:00:00-07:00'],
      ],
      [
        'weekly across DST start keeping 10:00 Mountain',
        { start: at('2026-03-03T10:00'), end: at('2026-03-03T11:00'), recurrence: { frequency: 'weekly' } },
        '2026-03-01T00:00',
        '2026-03-14T23:59',
        ['2026-03-03T10:00:00-07:00', '2026-03-10T10:00:00-06:00'],
      ],
      [
        'daily in the spring-forward gap',
        { start: at('2026-03-07T02:30'), end: at('2026-03-07T03:00'), recurrence: { frequency: 'daily' } },
        '2026-03-07T00:00',
        '2026-03-09T23:59',
        ['2026-03-07T02:30:00-07:00', '2026-03-08T03:30:00-06:00', '2026-03-09T02:30:00-06:00'],
      ],
    ])('can expand %s', (_, schedule, from, to, expected) => {
      expect(starts(expandOccurrences(schedule, at(from), at(to), zone))).toEqual(expected);
    });

    it('can keep the duration of each occurrence across DST end', () => {
      const result = expandOccurrences(
        { start: at('2026-10-27T10:00'), end: at('2026-10-27T11:00'), recurrence: { frequency: 'weekly' } },
        at('2026-11-03T00:00'),
        at('2026-11-03T23:59'),
        zone,
      );
      expect(result).toHaveLength(1);
      expect(toIso(result[0].recurrenceId)).toBe('2026-11-03T10:00:00-07:00');
      expect(toIso(result[0].end)).toBe('2026-11-03T11:00:00-07:00');
    });

    it('can keep all-day occurrences on local midnight across DST end', () => {
      const result = expandOccurrences(
        {
          start: at('2026-10-31T00:00'),
          end: at('2026-11-01T00:00'),
          isAllDay: true,
          recurrence: { frequency: 'daily' },
        },
        at('2026-10-31T00:00'),
        at('2026-11-02T23:59'),
        zone,
      );
      expect(result.map(({ start, end }) => [toIso(start), toIso(end)])).toEqual([
        ['2026-10-31T00:00:00-06:00', '2026-11-01T00:00:00-06:00'],
        ['2026-11-01T00:00:00-06:00', '2026-11-02T00:00:00-07:00'],
        ['2026-11-02T00:00:00-07:00', '2026-11-03T00:00:00-07:00'],
      ]);
    });

    it('can return nothing for non-recurring event', () => {
      const result = expandOccurrences(
        { start: at('2026-10-01T09:00'), end: at('2026-10-01T10:00') },
        at('2026-10-01T00:00'),
        at('2026-10-31T23:59'),
        zone,
      );
      expect(result).toEqual([]);
    });
  });

  describe('findOccurrence', () => {
    it('can find occurrence on a date', () => {
      expect(toIso(findOccurrence(teamMeeting, at('2026-10-20'), zone))).toBe('2026-10-20T10:00:00-06:00');
    });

    it('can find occurrence from a date-time in another offset', () => {
      const value = DateTime.fromISO('2026-11-03T17:00:00Z');
      expect(toIso(findOccurrence(teamMeeting, value, zone))).toBe('2026-11-03T10:00:00-07:00');
    });

    it('can find excluded occurrence', () => {
      expect(toIso(findOccurrence(teamMeeting, at('2026-10-13'), zone))).toBe('2026-10-13T10:00:00-06:00');
    });

    it.each([
      ['a day without an occurrence', '2026-10-21'],
      ['a date before the start', '2026-09-22'],
      ['a date after until', '2026-12-22'],
    ])('can return null for %s', (_, value) => {
      expect(findOccurrence(teamMeeting, at(value), zone)).toBeNull();
    });

    it('can return null for a date after count', () => {
      const schedule = { ...teamMeeting, recurrence: { frequency: 'weekly' as const, end: { count: 2 } } };
      expect(findOccurrence(schedule, at('2026-10-06'), zone)).toBeTruthy();
      expect(findOccurrence(schedule, at('2026-10-13'), zone)).toBeNull();
    });

    it('can return null for non-recurring event', () => {
      expect(findOccurrence({ start: at('2026-10-01T09:00') }, at('2026-10-01'), zone)).toBeNull();
    });
  });

  describe('getRecurrenceEndDate', () => {
    it('can return null for no end', () => {
      expect(getRecurrenceEndDate({ ...teamMeeting, recurrence: { frequency: 'weekly' } }, zone)).toBeNull();
    });

    it('can return null for non-recurring event', () => {
      expect(getRecurrenceEndDate({ start: at('2026-10-01T09:00') }, zone)).toBeNull();
    });

    it('can return until date', () => {
      expect(getRecurrenceEndDate(teamMeeting, zone)).toBe(20261215);
    });

    it('can return date of last occurrence for count', () => {
      const schedule = { ...teamMeeting, recurrence: { frequency: 'weekly' as const, end: { count: 3 } } };
      expect(getRecurrenceEndDate(schedule, zone)).toBe(20261013);
    });

    it('can include the duration of the last occurrence', () => {
      const schedule: RecurringSchedule = {
        start: at('2026-10-01T09:00'),
        end: at('2026-10-03T09:00'),
        recurrence: { frequency: 'daily', end: { count: 2 } },
      };
      expect(getRecurrenceEndDate(schedule, zone)).toBe(20261004);
    });
  });

  describe('toRecurrenceId', () => {
    it('can combine the occurrence date with the series start time', () => {
      expect(toIso(toRecurrenceId(at('2026-09-29T10:00'), 20261103, zone))).toBe('2026-11-03T10:00:00-07:00');
    });
  });
});
