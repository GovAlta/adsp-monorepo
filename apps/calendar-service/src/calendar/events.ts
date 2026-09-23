import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { Update } from '@core-services/core-common';
import { CalendarEntity, CalendarEventEntity } from './model';
import { Attendee, CalendarDefinition, CalendarEvent } from './types';

const userSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
};

const calendarSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    displayName: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
  },
};

const calendarDefinitionSchema = {
  type: 'object',
  properties: {
    ...calendarSchema.properties,
    readRoles: { type: 'array', items: { type: 'string' } },
    updateRoles: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'readRoles', 'updateRoles'],
};

export const CalendarDefinitionCreatedDefinition: DomainEventDefinition = {
  name: 'calendar-definition-created',
  description: 'Signalled when a tenant calendar definition is created.',
  payloadSchema: {
    type: 'object',
    properties: { calendar: calendarDefinitionSchema, createdBy: userSchema },
  },
};

export const CalendarDefinitionUpdatedDefinition: DomainEventDefinition = {
  name: 'calendar-definition-updated',
  description: 'Signalled when a tenant calendar definition is updated.',
  payloadSchema: {
    type: 'object',
    properties: { calendar: calendarDefinitionSchema, updatedBy: userSchema },
  },
};

export const CalendarDefinitionDeletedDefinition: DomainEventDefinition = {
  name: 'calendar-definition-deleted',
  description: 'Signalled when a tenant calendar definition is deleted.',
  payloadSchema: {
    type: 'object',
    properties: { calendar: calendarDefinitionSchema, deletedBy: userSchema },
  },
};

const eventSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
    },
    recordId: {
      type: ['string', 'null'],
    },
    context: {
      type: ['object', 'null'],
    },
    name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    start: {
      type: 'string',
      format: 'date-time',
    },
    end: {
      oneOf: [
        {
          type: 'string',
          format: 'date-time',
        },
        {
          type: 'null',
        },
      ],
    },
    isPublic: {
      type: 'boolean',
    },
    isAllDay: {
      type: 'boolean',
    },
  },
};

export const CalendarEventCreatedDefinition: DomainEventDefinition = {
  name: 'calendar-event-created',
  description: 'Signalled when a calendar event is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      calendar: calendarSchema,
      event: eventSchema,
      createdBy: userSchema,
    },
  },
};

export const CalendarEventUpdatedDefinition: DomainEventDefinition = {
  name: 'calendar-event-updated',
  description: 'Signalled when a calendar event is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      calendar: calendarSchema,
      update: {
        anyOf: [
          { ...eventSchema, additionalProperties: false },
          {
            type: 'object',
            properties: {
              operation: { type: 'string' },
              attendeeId: { type: 'number' },
              attendee: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: ['string', 'null'] },
                  email: { type: ['string', 'null'] },
                },
              },
            },
            required: ['operation'],
            additionalProperties: false,
          },
        ],
      },
      event: eventSchema,
      updatedBy: userSchema,
    },
  },
};

export const CalendarEventDeletedDefinition: DomainEventDefinition = {
  name: 'calendar-event-deleted',
  description: 'Signalled when a calendar event is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {
      calendar: calendarSchema,
      event: eventSchema,
      deletedBy: userSchema,
    },
  },
};

function mapCalendar(entity: CalendarEntity) {
  return {
    name: entity.name,
    displayName: entity.displayName,
    description: entity.description,
  };
}

function mapCalendarEvent(entity: CalendarEventEntity) {
  return {
    id: entity.id,
    recordId: entity.recordId,
    context: entity.context,
    name: entity.name,
    description: entity.description,
    start: entity.start,
    end: entity.end,
    isPublic: entity.isPublic,
    isAllDay: entity.isAllDay,
  };
}

function calendarDefinitionChanged(
  name: string,
  actor: 'createdBy' | 'updatedBy' | 'deletedBy',
  user: User,
  tenantId: AdspId,
  calendar: CalendarDefinition
): DomainEvent {
  return {
    tenantId,
    name,
    timestamp: new Date(),
    context: { calendar: calendar.name },
    correlationId: `calendar-${calendar.name}`,
    payload: {
      calendar: {
        ...calendar,
        readRoles: calendar.readRoles || [],
        updateRoles: calendar.updateRoles || [],
      },
      [actor]: { id: user.id, name: user.name },
    },
  };
}

export const calendarDefinitionCreated = (user: User, tenantId: AdspId, calendar: CalendarDefinition): DomainEvent =>
  calendarDefinitionChanged(CalendarDefinitionCreatedDefinition.name, 'createdBy', user, tenantId, calendar);

export const calendarDefinitionUpdated = (user: User, tenantId: AdspId, calendar: CalendarDefinition): DomainEvent =>
  calendarDefinitionChanged(CalendarDefinitionUpdatedDefinition.name, 'updatedBy', user, tenantId, calendar);

export const calendarDefinitionDeleted = (user: User, tenantId: AdspId, calendar: CalendarDefinition): DomainEvent =>
  calendarDefinitionChanged(CalendarDefinitionDeletedDefinition.name, 'deletedBy', user, tenantId, calendar);

export const calendarEventCreated = (user: User, entity: CalendarEventEntity): DomainEvent => ({
  tenantId: entity.calendar.tenantId,
  name: CalendarEventCreatedDefinition.name,
  timestamp: new Date(),
  context: {
    ...(entity.context || {}),
    calendar: entity.calendar.name,
  },
  correlationId: entity.recordId || `calendar-${entity.calendar.name}`,
  payload: {
    calendar: mapCalendar(entity.calendar),
    event: mapCalendarEvent(entity),
    createdBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const calendarEventUpdated = (
  user: User,
  update: Update<CalendarEvent> | { operation: string; attendee?: Attendee; attendeeId?: number },
  entity: CalendarEventEntity
): DomainEvent => ({
  tenantId: entity.calendar.tenantId,
  name: CalendarEventUpdatedDefinition.name,
  timestamp: new Date(),
  context: {
    ...(entity.context || {}),
    calendar: entity.calendar.name,
  },
  correlationId: entity.recordId || `calendar-${entity.calendar.name}`,
  payload: {
    calendar: mapCalendar(entity.calendar),
    update,
    event: mapCalendarEvent(entity),
    updatedBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const calendarEventDeleted = (user: User, entity: CalendarEventEntity): DomainEvent => ({
  tenantId: entity.calendar.tenantId,
  name: CalendarEventDeletedDefinition.name,
  timestamp: new Date(),
  context: {
    ...(entity.context || {}),
    calendar: entity.calendar.name,
  },
  correlationId: entity.recordId || `calendar-${entity.calendar.name}`,
  payload: {
    calendar: mapCalendar(entity.calendar),
    event: mapCalendarEvent(entity),
    deletedBy: {
      id: user.id,
      name: user.name,
    },
  },
});
