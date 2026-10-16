import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { DateTime } from 'luxon';
import { CalendarServiceRoles } from '../roles';
import { CalendarEntity } from './calendar';
import { CalendarEventEntity } from './event';

describe('CalendarEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const repositoryMock = {
    getDates: jest.fn(),
    getDate: jest.fn(),
    getCalendarEvent: jest.fn(),
    getCalendarEvents: jest.fn(),
    getCalendarEventsInRange: jest.fn(),
    getEventAttendees: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    saveAttendee: jest.fn(),
    saveExclusion: jest.fn(),
    deleteAttendee: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.getCalendarEvents.mockReset();
    repositoryMock.getCalendarEventsInRange.mockReset();
    repositoryMock.getCalendarEvent.mockReset();
  });

  it('can be created', () => {
    const result = new CalendarEntity(repositoryMock, tenantId, {
      name: 'test',
      displayName: 'Test',
      description: 'test',
      updateRoles: [],
      readRoles: [],
    });

    expect(result).toBeTruthy();
  });

  describe('canAccessPrivateEvent', () => {
    it('can return true for tenant service admin', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canAccessPrivateEvent({
        tenantId,
        id: 'test',
        roles: [CalendarServiceRoles.Admin],
      } as User);

      expect(result).toBeTruthy();
    });

    it('can return true for tenant reader', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canAccessPrivateEvent({
        tenantId,
        id: 'test',
        roles: ['test-reader'],
      } as User);

      expect(result).toBeTruthy();
    });

    it('can return true for tenant updater', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canAccessPrivateEvent({
        tenantId,
        id: 'test',
        roles: ['test-updater'],
      } as User);

      expect(result).toBeTruthy();
    });

    it('can return false for null user', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canAccessPrivateEvent(null);

      expect(result).toBeFalsy();
    });

    it('can return false for tenant user without roles', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canAccessPrivateEvent({
        tenantId,
        id: 'test',
        roles: [],
      } as User);

      expect(result).toBeFalsy();
    });

    it('can return false for other tenant user', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canAccessPrivateEvent({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test-2`,
        id: 'test',
        roles: [CalendarServiceRoles.Admin],
      } as User);

      expect(result).toBeFalsy();
    });

    it('can return true for core reader', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canAccessPrivateEvent({
        isCore: true,
        id: 'test',
        roles: ['test-reader'],
      } as User);

      expect(result).toBeTruthy();
    });
  });

  describe('canUpdateEvent', () => {
    it('can return true for tenant service admin', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canUpdateEvent({
        tenantId,
        id: 'test',
        roles: [CalendarServiceRoles.Admin],
      } as User);

      expect(result).toBeTruthy();
    });

    it('can return false for tenant reader', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canUpdateEvent({
        tenantId,
        id: 'test',
        roles: ['test-reader'],
      } as User);

      expect(result).toBeFalsy();
    });

    it('can return true for tenant updater', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canUpdateEvent({
        tenantId,
        id: 'test',
        roles: ['test-updater'],
      } as User);

      expect(result).toBeTruthy();
    });

    it('can return false for null user', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canUpdateEvent(null);

      expect(result).toBeFalsy();
    });

    it('can return false for tenant user without roles', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canUpdateEvent({
        tenantId,
        id: 'test',
        roles: [],
      } as User);

      expect(result).toBeFalsy();
    });

    it('can return false for other tenant user', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canUpdateEvent({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test-2`,
        id: 'test',
        roles: [CalendarServiceRoles.Admin],
      } as User);

      expect(result).toBeFalsy();
    });

    it('can return true for core user with admin role', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canUpdateEvent({
        isCore: true,
        id: 'test',
        roles: [CalendarServiceRoles.Admin],
      } as User);

      expect(result).toBeTruthy();
    });

    it('can return false for core user without roles', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const result = entity.canUpdateEvent({
        isCore: true,
        id: 'test',
        roles: [],
      } as User);

      expect(result).toBeFalsy();
    });
  });

  describe('getEvents', () => {
    it('can return result', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const values = {};
      repositoryMock.getCalendarEvents.mockReturnValueOnce(values);
      const result = await entity.getEvents(
        {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        } as User,
        10,
      );

      expect(result).toBe(values);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(entity, 10, undefined, undefined);
    });

    it('can require public for user without access', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const values = {};
      repositoryMock.getCalendarEvents.mockReturnValueOnce(values);
      const result = await entity.getEvents(
        {
          tenantId,
          id: 'test',
          roles: [],
        } as User,
        10,
      );

      expect(result).toBe(values);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(
        entity,
        10,
        undefined,
        expect.objectContaining({ isPublic: true }),
      );
    });
  });

  describe('getEventsInRange', () => {
    it('can return range result', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });
      const from = DateTime.fromISO('2021-03-01T00:00:00-07:00');
      const to = DateTime.fromISO('2021-03-31T23:59:59-06:00');

      const values = [];
      repositoryMock.getCalendarEventsInRange.mockReturnValueOnce(values);
      const result = await entity.getEventsInRange(
        {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        } as User,
        from,
        to,
      );

      expect(result).toEqual(values);
      expect(repositoryMock.getCalendarEventsInRange).toHaveBeenCalledWith(entity, from, to, {});
    });

    it('can require public for range retrieval by user without access', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });
      const from = DateTime.fromISO('2021-03-01T00:00:00-07:00');
      const to = DateTime.fromISO('2021-03-31T23:59:59-06:00');

      const values = [];
      repositoryMock.getCalendarEventsInRange.mockReturnValueOnce(values);
      const result = await entity.getEventsInRange(
        {
          tenantId,
          id: 'test',
          roles: [],
        } as User,
        from,
        to,
      );

      expect(result).toEqual(values);
      expect(repositoryMock.getCalendarEventsInRange).toHaveBeenCalledWith(entity, from, to, { isPublic: true });
    });

    it('can pass criteria for range retrieval', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });
      const from = DateTime.fromISO('2021-03-01T00:00:00-07:00');
      const to = DateTime.fromISO('2021-03-31T23:59:59-06:00');
      const criteria = { recordId: 'record-1', isPublic: false };

      const values = [];
      repositoryMock.getCalendarEventsInRange.mockReturnValueOnce(values);
      const result = await entity.getEventsInRange(
        {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        } as User,
        from,
        to,
        criteria,
      );

      expect(result).toEqual(values);
      expect(repositoryMock.getCalendarEventsInRange).toHaveBeenCalledWith(entity, from, to, criteria);
    });

    describe('with recurring events', () => {
      const zone = 'America/Edmonton';
      const reader = { tenantId, id: 'test', roles: ['test-reader'] } as User;
      const calendarEntity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });
      const from = DateTime.fromISO('2026-10-01T00:00', { zone });
      const to = DateTime.fromISO('2026-10-31T23:59', { zone });

      const createSeries = () => {
        const series = new CalendarEventEntity(repositoryMock, calendarEntity, {
          id: 42,
          name: 'Team meeting',
          description: null,
          isPublic: false,
          isAllDay: false,
          start: DateTime.fromISO('2026-09-29T10:00', { zone }),
          end: DateTime.fromISO('2026-09-29T11:00', { zone }),
          recurrence: { frequency: 'weekly', interval: 1, daysOfWeek: ['TU'], end: { until: '2026-12-15' } },
        });
        series.exclusions = [20261013];
        return series;
      };

      const createSingle = () =>
        new CalendarEventEntity(repositoryMock, calendarEntity, {
          id: 7,
          name: 'One-off',
          description: null,
          isPublic: false,
          isAllDay: false,
          start: DateTime.fromISO('2026-10-15T09:00', { zone }),
          end: DateTime.fromISO('2026-10-15T10:00', { zone }),
        });

      it('can expand occurrences and merge them with single events by start', async () => {
        const series = createSeries();
        const single = createSingle();
        repositoryMock.getCalendarEventsInRange.mockResolvedValueOnce([series, single]);

        const result = await calendarEntity.getEventsInRange(reader, from, to);

        expect(result.map((r) => r.start.toISO({ suppressMilliseconds: true }))).toEqual([
          '2026-10-06T10:00:00-06:00',
          '2026-10-15T09:00:00-06:00',
          '2026-10-20T10:00:00-06:00',
          '2026-10-27T10:00:00-06:00',
        ]);
        expect(result[1]).toBe(single);
        expect(result[0]).toEqual(expect.objectContaining({ event: series, recurrenceId: expect.any(DateTime) }));
      });

      it('can apply time criteria to occurrences', async () => {
        const series = createSeries();
        repositoryMock.getCalendarEventsInRange.mockResolvedValueOnce([series]);
        const startsAfter = DateTime.fromISO('2026-10-19T00:00', { zone });

        const result = await calendarEntity.getEventsInRange(reader, from, to, { startsAfter });

        expect(result.map((r) => r.start.toISODate())).toEqual(['2026-10-20', '2026-10-27']);
      });

      it('can apply end and active criteria to occurrences', async () => {
        const series = createSeries();
        repositoryMock.getCalendarEventsInRange.mockResolvedValue([series]);

        const endsBefore = await calendarEntity.getEventsInRange(reader, from, to, {
          endsBefore: DateTime.fromISO('2026-10-20T11:00', { zone }),
        });
        const activeOn = await calendarEntity.getEventsInRange(reader, from, to, {
          activeOn: DateTime.fromISO('2026-10-27T10:30', { zone }),
        });

        expect(endsBefore.map((r) => r.start.toISODate())).toEqual(['2026-10-06', '2026-10-20']);
        expect(activeOn.map((r) => r.start.toISODate())).toEqual(['2026-10-27']);
      });
    });
  });

  describe('getEvent', () => {
    it('can return event', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const value = {};
      repositoryMock.getCalendarEvent.mockReturnValueOnce(value);
      const result = await entity.getEvent(
        {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        } as User,
        1,
      );

      expect(result).toBe(value);
      expect(repositoryMock.getCalendarEvent).toHaveBeenCalledWith(entity, 1);
    });

    it('can throw for unauthorized access to private event', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const value = { isPublic: false };
      repositoryMock.getCalendarEvent.mockReturnValueOnce(value);

      await expect(
        entity.getEvent(
          {
            tenantId,
            id: 'test',
            roles: [],
          } as User,
          1,
        ),
      ).rejects.toThrow(UnauthorizedUserError);
    });

    it('can return public event to anonymous user', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const value = { isPublic: true };
      repositoryMock.getCalendarEvent.mockReturnValueOnce(value);
      const result = await entity.getEvent(
        {
          tenantId,
          id: 'test',
          roles: [],
        } as User,
        1,
      );

      expect(result).toBe(value);
      expect(repositoryMock.getCalendarEvent).toHaveBeenCalledWith(entity, 1);
    });
  });

  describe('createEvent', () => {
    it('can create event', async () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const newEvent = {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      };

      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));
      const result = await entity.createEvent(
        {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        } as User,
        newEvent,
      );

      expect(result).toMatchObject(newEvent);
    });

    it('can throw for unauthorized user.', () => {
      const entity = new CalendarEntity(repositoryMock, tenantId, {
        name: 'test',
        displayName: 'Test',
        description: 'test',
        updateRoles: ['test-updater'],
        readRoles: ['test-reader'],
      });

      const newEvent = {
        name: 'test',
        description: 'testing 1 2 3',
        isPublic: false,
        isAllDay: false,
        start: DateTime.now(),
        end: null,
      };

      expect(() =>
        entity.createEvent(
          {
            tenantId,
            id: 'test',
            roles: [],
          } as User,
          newEvent,
        ),
      ).toThrow(UnauthorizedUserError);
    });
  });
});
