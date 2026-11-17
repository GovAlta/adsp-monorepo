import {
  AdspId,
  AuditAction,
  AuditCategories,
  AuditChangeSet,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { isDeepStrictEqual } from 'util';
import { Logger } from 'winston';
import type { CalendarEventEntity } from './model';
import type { Attendee, CalendarDefinition } from './types';

const CALENDAR_RESOURCE_TYPE = 'calendar';
const EVENT_RESOURCE_TYPE = 'event';
const LOG_CONTEXT = 'calendar-audit';

export const CalendarCreatedAuditAction: AuditAction = {
  name: 'calendar.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: CALENDAR_RESOURCE_TYPE,
  description: 'A tenant calendar is created.',
};

export const CalendarUpdatedAuditAction: AuditAction = {
  name: 'calendar.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: CALENDAR_RESOURCE_TYPE,
  captureChangeSet: true,
  description: 'Calendar metadata or access roles are updated.',
};

export const CalendarDeletedAuditAction: AuditAction = {
  name: 'calendar.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: CALENDAR_RESOURCE_TYPE,
  description: 'A tenant calendar is deleted.',
};

export const EventCreatedAuditAction: AuditAction = {
  name: 'event.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: EVENT_RESOURCE_TYPE,
  description: 'A calendar event is created.',
};

export const EventUpdatedAuditAction: AuditAction = {
  name: 'event.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: EVENT_RESOURCE_TYPE,
  description: "A calendar event's details are modified.",
};

export const EventDeletedAuditAction: AuditAction = {
  name: 'event.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: EVENT_RESOURCE_TYPE,
  description: 'A calendar event is deleted.',
};

export const EventOccurrenceCancelledAuditAction: AuditAction = {
  name: 'event.occurrence-cancelled',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: EVENT_RESOURCE_TYPE,
  description: 'A single occurrence of a recurring calendar event is cancelled.',
};

export const AttendeeAddedAuditAction: AuditAction = {
  name: 'attendee.added',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  resourceType: EVENT_RESOURCE_TYPE,
  description: 'An attendee is added to a calendar event.',
};

export const AttendeeRemovedAuditAction: AuditAction = {
  name: 'attendee.removed',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  resourceType: EVENT_RESOURCE_TYPE,
  description: 'An attendee is removed from a calendar event.',
};

export const CalendarAuditActions: AuditAction[] = [
  CalendarCreatedAuditAction,
  CalendarUpdatedAuditAction,
  CalendarDeletedAuditAction,
  EventCreatedAuditAction,
  EventUpdatedAuditAction,
  EventDeletedAuditAction,
  EventOccurrenceCancelledAuditAction,
  AttendeeAddedAuditAction,
  AttendeeRemovedAuditAction,
];

type AuditedCalendar = Pick<CalendarDefinition, 'name' | 'displayName'>;
type CalendarAccessFields = Pick<CalendarDefinition, 'readRoles' | 'updateRoles'>;

/** Audit details of a tenant calendar definition. */
export function toCalendarAuditDetails(
  tenantId: AdspId,
  user: User,
  calendar: AuditedCalendar,
  metadata: Record<string, unknown> = {},
  changeSet?: AuditChangeSet,
): AuditRecordDetails {
  return {
    tenantId,
    actor: toAuditActor(user),
    resource: { type: CALENDAR_RESOURCE_TYPE, id: calendar.name, name: calendar.displayName },
    metadata: { calendarName: calendar.name, displayName: calendar.displayName, ...metadata },
    ...(changeSet ? { changeSet } : {}),
  };
}

const toCalendarFields = ({
  displayName,
  description,
  readRoles,
  updateRoles,
}: Pick<CalendarDefinition, 'displayName' | 'description'> & CalendarAccessFields) => ({
  displayName,
  description: description ?? '',
  readRoles: readRoles ?? [],
  updateRoles: updateRoles ?? [],
});

/** Audit details of a calendar update. The description is free text, so it is only listed in the updated fields. */
export function toCalendarUpdatedAuditDetails(
  tenantId: AdspId,
  user: User,
  previous: CalendarDefinition,
  updated: CalendarDefinition,
): AuditRecordDetails {
  const before = toCalendarFields(previous);
  const after = toCalendarFields(updated);
  const updatedFields = Object.keys(after).filter((key) => !isDeepStrictEqual(before[key], after[key]));
  const changeSetFields = updatedFields.filter((field) => field !== 'description');

  const pick = (values: Record<string, unknown>) =>
    Object.fromEntries(changeSetFields.map((field) => [field, values[field]]));

  return toCalendarAuditDetails(
    tenantId,
    user,
    updated,
    { updatedFields, accessRolesChanged: updatedFields.some((field) => field.endsWith('Roles')) },
    changeSetFields.length > 0 ? { before: pick(before), after: pick(after) } : undefined,
  );
}

type AuditedEvent = Pick<CalendarEventEntity, 'id' | 'name' | 'start' | 'end' | 'calendar'>;

/** Audit details of a calendar event. Event description, context, and attendees are never recorded. */
export function toEventAuditDetails(
  user: User,
  event: AuditedEvent,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId: event.calendar.tenantId,
    actor: toAuditActor(user),
    resource: { type: EVENT_RESOURCE_TYPE, id: `${event.id}`, name: event.name },
    metadata: {
      calendarName: event.calendar.name,
      eventName: event.name,
      start: event.start?.toISO() ?? null,
      end: event.end?.toISO() ?? null,
      ...metadata,
    },
  };
}

/** Audit details of an attendee operation. Only the attendee name is recorded; the email address is PII. */
export function toAttendeeAuditDetails(
  user: User,
  event: AuditedEvent,
  attendee: Pick<Attendee, 'name'> | null | undefined,
): AuditRecordDetails {
  return toEventAuditDetails(user, event, { attendeeName: attendee?.name ?? null });
}

/**
 * Records an audit event without blocking or failing the operation. Details are built inside the guard, so an
 * error creating them is logged instead of failing a request that has already been responded to.
 */
export function recordCalendarAudit(
  auditService: AuditService,
  logger: Logger,
  action: AuditAction,
  getDetails: () => AuditRecordDetails,
): void {
  const warn = (message: string, meta: Record<string, unknown> = {}) =>
    logger.warn(message, { context: LOG_CONTEXT, ...meta });

  try {
    const details = getDetails();
    if (!details.tenantId) {
      return;
    }

    const tenant = details.tenantId.toString();
    void auditService
      .record(action, details)
      .then((outcome) => {
        if (outcome.status === 'recorded' || (outcome.status === 'rejected' && outcome.code === 'audit_disabled')) {
          return;
        }
        warn(`Audit event ${action.name} for ${details.resource?.id} was not recorded (${outcome.status}).`, {
          tenant,
          eventId: outcome.eventId,
        });
      })
      .catch((err) =>
        warn(`Failed to record audit event ${action.name} for ${details.resource?.id}: ${err}`, { tenant }),
      );
  } catch (err) {
    warn(`Failed to record audit event ${action.name}: ${err}`);
  }
}
