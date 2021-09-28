import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, New } from '@core-services/core-common';
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
    getEventAttendees: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
    saveAttendee: jest.fn(),
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
        })
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
        update
      );

      expect(result).toMatchObject(update);
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
          update
        )
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
          update
        )
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
        } as User)
      ).toThrow(UnauthorizedUserError);
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
        } as User)
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
        { id: 1, name: null, email: null } as New<Attendee>
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
          { name: null, email: null }
        )
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
        { id: 1, name: null, email: null }
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
          { id: 1, name: null, email: null }
        )
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
        1
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
          1
        )
      ).toThrow(UnauthorizedUserError);
    });
  });
});
