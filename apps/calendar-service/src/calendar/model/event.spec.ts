import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, New, NotFoundError } from '@core-services/core-common';
import { DateTime } from 'luxon';
import { Attendee } from '../types';
import { CalendarEntity } from './calendar';
import { CalendarEventEntity } from './event';

describe('CalendarEventEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const repositoryMock = {
    getDates: jest.fn(),
    getDate: jest.fn(),
    getCalendarEvent: jest.fn(),
    getCalendarEvents: jest.fn(),
    getCalendarEventsInRange: jest.fn(),
    getEventAttendees: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
    saveAttendee: jest.fn(),
    saveExclusion: jest.fn(),
    deleteAttendee: jest.fn(),
  };

  const calendar = new CalendarEntity(repositoryMock, tenantId, {
    name: 'test',
    displayName: 'Test',
    description: 'test',
    updateRoles: ['test-updater'],
    readRoles: ['test-reader'],
  });

  beforeEach(() => {
    repositoryMock.delete.mockReset();
    repositoryMock.saveAttendee.mockReset();
    repositoryMock.saveExclusion.mockReset();
    repositoryMock.deleteAttendee.mockReset();
  });

  it('can be created', () => {
    const result = new CalendarEventEntity(repositoryMock, calendar, {
      name: 'test',
      description: 'testing 1 2 3',
      isPublic: false,
      isAllDay: false,
      start: DateTime.now(),
      end: null,
    });

    expect(result).toBeTruthy();
  });

  it('can be created from record', () => {
    const result = new CalendarEventEntity(repositoryMock, calendar, {
      id: 1,
      name: 'test',
      description: 'testing 1 2 3',
      isPublic: false,
      isAllDay: false,
      start: DateTime.now(),
      end: null,
    });

    expect(result).toBeTruthy();
  });

  it('can throw for end before start', () => {
    expect(
      () =>
        new CalendarEventEntity(repositoryMock, calendar, {
          name: 'test',
          description: 'testing 1 2 3',
          isPublic: false,
          isAllDay: false,
          start: DateTime.now(),
          end: DateTime.now().minus(500),
        }),
    ).toThrow(InvalidOperationError);
  });

  describe('update', () => {
    it('can update event', async () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      const update = {
        name: 'test-2',
        description: '1 2 3 testing',
        isPublic: true,
        isAllDay: true,
        start: DateTime.now(),
        end: DateTime.now().plus(500),
      };

      const result = await event.update(
        {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        } as User,
        update,
      );

      expect(result).toMatchObject(update);
    });

    it('can update event context', async () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      const update = {
        context: {
          test: 'value',
        },
      };

      const result = await event.update(
        {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        } as User,
        update,
      );

      expect(result).toEqual(expect.objectContaining({ context: update.context }));
    });

    it('can throw for unauthorized user', () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      const update = {
        name: 'test-2',
        description: '1 2 3 testing',
        isPublic: true,
        isAllDay: true,
        start: DateTime.now(),
        end: DateTime.now().plus(500),
      };

      expect(() =>
        event.update(
          {
            tenantId,
            id: 'test',
            roles: [],
          } as User,
          update,
        ),
      ).toThrow(UnauthorizedUserError);
    });

    it('can throw for end before start', () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      const update = {
        name: 'test-2',
        description: '1 2 3 testing',
        isPublic: true,
        isAllDay: true,
        start: DateTime.now(),
        end: DateTime.now().minus(500),
      };

      expect(() =>
        event.update(
          {
            tenantId,
            id: 'test',
            roles: ['test-updater'],
          } as User,
          update,
        ),
      ).toThrow(InvalidOperationError);
    });

    it('can throw for end before start on a partial update of only end', () => {
      const start = DateTime.now();
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start,
        end: start.plus(500),
      });

      expect(() =>
        event.update(
          {
            tenantId,
            id: 'test',
            roles: ['test-updater'],
          } as User,
          { end: start.minus(500) },
        ),
      ).toThrow(InvalidOperationError);
    });

    it('can throw for end before start on a partial update of only start', () => {
      const end = DateTime.now();
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: end.minus(500),
        end,
      });

      expect(() =>
        event.update(
          {
            tenantId,
            id: 'test',
            roles: ['test-updater'],
          } as User,
          { start: end.plus(500) },
        ),
      ).toThrow(InvalidOperationError);
    });
  });

  describe('delete', () => {
    it('can delete event', async () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      repositoryMock.delete.mockResolvedValueOnce(true);
      const result = await event.delete({
        tenantId,
        id: 'test',
        roles: ['test-updater'],
      } as User);

      expect(result).toBe(true);
    });

    it('can throw for unauthorized user', async () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      expect(() =>
        event.delete({
          tenantId,
          id: 'test',
          roles: [],
        } as User),
      ).toThrow(UnauthorizedUserError);
    });
  });

  describe('recurrence', () => {
    const zone = 'America/Edmonton';
    const updater = { tenantId, id: 'test', roles: ['test-updater'] } as User;
    const tuesday = DateTime.fromISO('2026-09-29T10:00', { zone });

    const createSeries = () => {
      const series = new CalendarEventEntity(repositoryMock, calendar, {
        id: 42,
        name: 'Team meeting',
        description: null,
        isPublic: false,
        isAllDay: false,
        start: tuesday,
        end: tuesday.plus({ hours: 1 }),
        recurrence: { frequency: 'weekly', interval: 1, daysOfWeek: ['TU'], end: { until: '2026-12-15' } },
      });
      series.exclusions = [20261013];
      return series;
    };

    it('can create event with normalized recurrence', () => {
      const result = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: null,
        isPublic: false,
        isAllDay: false,
        start: tuesday,
        end: null,
        recurrence: { frequency: 'weekly' },
      });

      expect(result.recurrence).toEqual({ frequency: 'weekly', interval: 1, daysOfWeek: ['TU'] });
      expect(result.exclusions).toEqual([]);
    });

    it('can create event without recurrence', () => {
      const result = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: null,
        isPublic: false,
        isAllDay: false,
        start: tuesday,
        end: null,
      });

      expect(result.recurrence).toBeNull();
      expect(result.getOccurrences(tuesday, tuesday.plus({ days: 30 }))).toEqual([]);
    });

    it('can throw for invalid recurrence on create', () => {
      expect(
        () =>
          new CalendarEventEntity(repositoryMock, calendar, {
            name: 'test',
            description: null,
            isPublic: false,
            isAllDay: false,
            start: tuesday,
            end: null,
            recurrence: { frequency: 'weekly', end: { until: '2026-12-15', count: 3 } },
          }),
      ).toThrow(InvalidOperationError);
    });

    it('can get occurrences with the parent event', () => {
      const series = createSeries();
      const result = series.getOccurrences(
        DateTime.fromISO('2026-10-01T00:00', { zone }),
        DateTime.fromISO('2026-10-31T23:59', { zone }),
      );

      expect(result.map((r) => r.start.toISODate())).toEqual(['2026-10-06', '2026-10-20', '2026-10-27']);
      expect(result.every((r) => r.event === series)).toBe(true);
    });

    it('can get excluded recurrence IDs', () => {
      const series = createSeries();
      expect(series.getExcludedRecurrenceIds().map((r) => r.toISO({ suppressMilliseconds: true }))).toEqual([
        '2026-10-13T10:00:00-06:00',
      ]);
    });

    describe('update', () => {
      it('can add recurrence to a single event', async () => {
        const event = new CalendarEventEntity(repositoryMock, calendar, {
          id: 1,
          name: 'test',
          description: null,
          isPublic: false,
          isAllDay: false,
          start: tuesday,
          end: null,
        });

        const result = await event.update(updater, { recurrence: { frequency: 'daily', end: { count: 5 } } });

        expect(result.recurrence).toEqual({ frequency: 'daily', interval: 1, end: { count: 5 } });
      });

      it('can replace the whole recurrence', async () => {
        const series = createSeries();
        const result = await series.update(updater, { recurrence: { frequency: 'monthly' } });

        expect(result.recurrence).toEqual({ frequency: 'monthly', interval: 1 });
      });

      it('can shorten the series with until', async () => {
        const series = createSeries();
        const result = await series.update(updater, {
          recurrence: { frequency: 'weekly', daysOfWeek: ['TU'], end: { until: '2026-11-10' } },
        });

        const occurrences = result.getOccurrences(
          DateTime.fromISO('2026-11-01T00:00', { zone }),
          DateTime.fromISO('2026-11-30T23:59', { zone }),
        );
        expect(occurrences.map((r) => r.start.toISODate())).toEqual(['2026-11-03', '2026-11-10']);
      });

      it('can remove recurrence', async () => {
        const series = createSeries();
        const result = await series.update(updater, { recurrence: null });

        expect(result.recurrence).toBeNull();
      });

      it('can keep recurrence and exclusions when updating other fields', async () => {
        const series = createSeries();
        const result = await series.update(updater, {
          start: tuesday.plus({ hours: 1 }),
          end: tuesday.plus({ hours: 2 }),
        });

        expect(result.recurrence).toEqual(expect.objectContaining({ frequency: 'weekly' }));
        expect(result.exclusions).toEqual([20261013]);
      });

      it('can throw when the new start is not on a recurrence day', () => {
        const series = createSeries();

        expect(() =>
          series.update(updater, { start: tuesday.plus({ days: 1 }), end: tuesday.plus({ days: 1, hours: 1 }) }),
        ).toThrow(InvalidOperationError);
      });

      it('can throw for invalid recurrence', () => {
        const series = createSeries();

        expect(() => series.update(updater, { recurrence: { frequency: 'daily', interval: 0 } })).toThrow(
          InvalidOperationError,
        );
      });
    });

    describe('excludeOccurrence', () => {
      it('can exclude occurrence', async () => {
        const series = createSeries();
        repositoryMock.saveExclusion.mockResolvedValueOnce(true);

        const result = await series.excludeOccurrence(updater, DateTime.fromISO('2026-10-20', { zone }));

        expect(result.deleted).toBe(true);
        expect(result.recurrenceId.toISO({ suppressMilliseconds: true })).toBe('2026-10-20T10:00:00-06:00');
        expect(repositoryMock.saveExclusion).toHaveBeenCalledWith(series, 20261020);
        expect(series.exclusions).toEqual([20261013, 20261020]);
      });

      it('can return not deleted for already excluded occurrence', async () => {
        const series = createSeries();
        repositoryMock.saveExclusion.mockResolvedValueOnce(false);

        const result = await series.excludeOccurrence(updater, DateTime.fromISO('2026-10-13', { zone }));

        expect(result.deleted).toBe(false);
        expect(series.exclusions).toEqual([20261013]);
      });

      it('can throw for unauthorized user', async () => {
        const series = createSeries();

        await expect(
          series.excludeOccurrence({ tenantId, id: 'test', roles: ['test-reader'] } as User, tuesday),
        ).rejects.toThrow(UnauthorizedUserError);
        expect(repositoryMock.saveExclusion).not.toHaveBeenCalled();
      });

      it('can throw for non-recurring event', async () => {
        const event = new CalendarEventEntity(repositoryMock, calendar, {
          id: 1,
          name: 'test',
          description: null,
          isPublic: false,
          isAllDay: false,
          start: tuesday,
          end: null,
        });

        await expect(event.excludeOccurrence(updater, tuesday)).rejects.toThrow(InvalidOperationError);
      });

      it('can throw not found for date that is not an occurrence', async () => {
        const series = createSeries();

        await expect(series.excludeOccurrence(updater, DateTime.fromISO('2026-10-21', { zone }))).rejects.toThrow(
          NotFoundError,
        );
        await expect(series.excludeOccurrence(updater, DateTime.fromISO('2026-12-22', { zone }))).rejects.toThrow(
          NotFoundError,
        );
        expect(repositoryMock.saveExclusion).not.toHaveBeenCalled();
      });
    });
  });

  describe('loadAttendees', () => {
    it('can load attendees', async () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      const attendees = [];
      repositoryMock.getEventAttendees.mockResolvedValueOnce(attendees);
      const result = await event.loadAttendees({
        tenantId,
        id: 'test',
        roles: ['test-updater'],
      } as User);

      expect(result).toBe(attendees);
      expect(event.attendees).toBe(attendees);
    });

    it('can throw for unauthorized user', async () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      await expect(
        event.loadAttendees({
          tenantId,
          id: 'test',
          roles: [],
        } as User),
      ).rejects.toThrow(UnauthorizedUserError);
    });
  });

  describe('addAttendee', () => {
    it('can add attendee', async () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      const attendee = {};
      repositoryMock.saveAttendee.mockResolvedValueOnce(attendee);
      const result = await event.addAttendee(
        {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        } as User,
        { id: 1, name: null, email: null } as New<Attendee>,
      );

      expect(result).toBe(attendee);
      expect(repositoryMock.saveAttendee).toHaveBeenCalledWith(event, expect.objectContaining({ id: undefined }));
    });

    it('can throw for unauthorized user', () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      expect(() =>
        event.addAttendee(
          {
            tenantId,
            id: 'test',
            roles: [],
          } as User,
          { name: null, email: null },
        ),
      ).toThrow(UnauthorizedUserError);
    });
  });

  describe('updateAttendee', () => {
    it('can update attendee', async () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      const attendee = {};
      repositoryMock.saveAttendee.mockResolvedValueOnce(attendee);
      const result = await event.updateAttendee(
        {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        } as User,
        { id: 1, name: null, email: null },
      );

      expect(result).toBe(attendee);
      expect(repositoryMock.saveAttendee).toHaveBeenCalledWith(event, expect.objectContaining({ id: 1 }));
    });

    it('can throw for unauthorized user', () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      expect(() =>
        event.updateAttendee(
          {
            tenantId,
            id: 'test',
            roles: [],
          } as User,
          { id: 1, name: null, email: null },
        ),
      ).toThrow(UnauthorizedUserError);
    });
  });

  describe('deleteAttendee', () => {
    it('can delete attendee', async () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      repositoryMock.deleteAttendee.mockResolvedValueOnce(true);
      const result = await event.deleteAttendee(
        {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        } as User,
        1,
      );

      expect(result).toBe(true);
      expect(repositoryMock.deleteAttendee).toHaveBeenCalledWith(event, 1);
    });

    it('can throw for unauthorized user', () => {
      const event = new CalendarEventEntity(repositoryMock, calendar, {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      });

      expect(() =>
        event.deleteAttendee(
          {
            tenantId,
            id: 'test',
            roles: [],
          } as User,
          1,
        ),
      ).toThrow(UnauthorizedUserError);
    });
  });
});
