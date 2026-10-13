import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { DateTime } from 'luxon';
import { CalendarServiceRoles } from '../roles';
import { CalendarEntity } from './calendar';

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
        10
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
        10
      );

      expect(result).toBe(values);
      expect(repositoryMock.getCalendarEvents).toHaveBeenCalledWith(
        entity,
        10,
        undefined,
        expect.objectContaining({ isPublic: true })
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
        to
      );

      expect(result).toBe(values);
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
        to
      );

      expect(result).toBe(values);
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
        criteria
      );

      expect(result).toBe(values);
      expect(repositoryMock.getCalendarEventsInRange).toHaveBeenCalledWith(entity, from, to, criteria);
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
        1
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
          1
        )
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
        1
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
        newEvent
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
          newEvent
        )
      ).toThrow(UnauthorizedUserError);
    });
  });
});
