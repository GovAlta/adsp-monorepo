import { adspId, auditDefinitions, resolveRetentionClass } from '@abgov/adsp-service-sdk';
import { DateTime } from 'luxon';
import {
  AttendeeAddedAuditAction,
  CalendarAuditActions,
  EventCreatedAuditAction,
  recordCalendarAudit,
  toAttendeeAuditDetails,
  toCalendarUpdatedAuditDetails,
} from './audit';

describe('calendar audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'user-1', name: 'tester', roles: ['calendar-admin'] } as never;
  const definition = {
    name: 'test',
    displayName: 'Test',
    description: 'a',
    readRoles: ['reader'],
    updateRoles: ['updater'],
  };

  it('defines the nine actions with unique names', () => {
    expect(CalendarAuditActions).toHaveLength(9);
    expect(() => auditDefinitions(CalendarAuditActions)).not.toThrow();
  });

  it('resolves retention as specified', () => {
    const retention = Object.fromEntries(CalendarAuditActions.map((a) => [a.name, resolveRetentionClass(a)]));
    expect(retention).toEqual({
      'calendar.created': 'standard',
      'calendar.updated': 'standard',
      'calendar.deleted': 'standard',
      'event.created': 'standard',
      'event.updated': 'standard',
      'event.deleted': 'standard',
      'event.occurrence-cancelled': 'standard',
      'attendee.added': 'compliance',
      'attendee.removed': 'compliance',
    });
  });

  it('does not override retention class where the category default applies', () => {
    expect('retentionClass' in AttendeeAddedAuditAction).toBe(false);
  });

  describe('toCalendarUpdatedAuditDetails', () => {
    it('records roles change set and omits description', () => {
      const details = toCalendarUpdatedAuditDetails(tenantId, user, definition, {
        ...definition,
        description: 'b',
        updateRoles: ['updater', 'other'],
      });

      expect(details.metadata).toEqual(
        expect.objectContaining({ updatedFields: ['description', 'updateRoles'], accessRolesChanged: true }),
      );
      expect(details.changeSet).toEqual({
        before: { updateRoles: ['updater'] },
        after: { updateRoles: ['updater', 'other'] },
      });
    });
  });

  describe('toAttendeeAuditDetails', () => {
    it('records the attendee name but not the email', () => {
      const event = {
        id: 1,
        name: 'meeting',
        start: DateTime.fromISO('2026-01-01T10:00:00Z'),
        end: null,
        calendar: { name: 'test', tenantId },
      } as never;

      const details = toAttendeeAuditDetails(user, event, { name: 'tester', email: 'tester@test.co' } as never);

      expect(details.metadata).toEqual(expect.objectContaining({ attendeeName: 'tester', calendarName: 'test' }));
      expect(JSON.stringify(details)).not.toContain('tester@test.co');
    });
  });

  describe('recordCalendarAudit', () => {
    const logger = { warn: jest.fn() };

    beforeEach(() => logger.warn.mockReset());

    it('does not throw when recording rejects', async () => {
      const auditService = { record: jest.fn().mockRejectedValue(new Error('down')) };
      recordCalendarAudit(auditService as never, logger as never, EventCreatedAuditAction, () => ({
        tenantId,
        actor: { id: 'u', type: 'user' },
      }));
      await new Promise(process.nextTick);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('does not throw when building details fails', () => {
      const auditService = { record: jest.fn() };
      expect(() =>
        recordCalendarAudit(auditService as never, logger as never, EventCreatedAuditAction, () => {
          throw new Error('bad');
        }),
      ).not.toThrow();
      expect(auditService.record).not.toHaveBeenCalled();
    });
  });
});
