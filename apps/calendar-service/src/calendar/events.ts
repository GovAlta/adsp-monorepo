import { DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { Update } from '@core-services/core-common';
import { CalendarEventEntity } from './model';
import { Attendee, CalendarEvent } from './types';

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

const eventSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
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
    calendar: calendarSchema,
    update: {
      oneOf: [
        eventSchema,
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
        },
      ],
    },
    event: eventSchema,
    updatedBy: userSchema,
  },
};

export const CalendarEventDeletedDefinition: DomainEventDefinition = {
  name: 'calendar-event-deleted',
  description: 'Signalled when a calendar event is deleted.',
  payloadSchema: {
    calendar: calendarSchema,
    event: eventSchema,
    deletedBy: userSchema,
  },
};

export const calendarEventCreated = (user: User, entity: CalendarEventEntity): DomainEvent => ({
  tenantId: entity.calendar.tenantId,
  name: CalendarEventCreatedDefinition.name,
  timestamp: new Date(),
  context: {
    calendar: entity.calendar.name,
  },
  payload: {
    calendar: {
      name: entity.calendar.name,
      displayName: entity.calendar.displayName,
      description: entity.calendar.description,
    },
    event: {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      start: entity.start,
      end: entity.end,
      isPublic: entity.isPublic,
      isAllDay: entity.isAllDay,
    },
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
  name: CalendarEventCreatedDefinition.name,
  timestamp: new Date(),
  context: {
    calendar: entity.calendar.name,
  },
  payload: {
    calendar: {
      name: entity.calendar.name,
      displayName: entity.calendar.displayName,
      description: entity.calendar.description,
    },
    update,
    event: {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      start: entity.start,
      end: entity.end,
      isPublic: entity.isPublic,
      isAllDay: entity.isAllDay,
    },
    createdBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const calendarEventDeleted = (user: User, entity: CalendarEventEntity): DomainEvent => ({
  tenantId: entity.calendar.tenantId,
  name: CalendarEventCreatedDefinition.name,
  timestamp: new Date(),
  context: {
    calendar: entity.calendar.name,
  },
  payload: {
    calendar: {
      name: entity.calendar.name,
      displayName: entity.calendar.displayName,
      description: entity.calendar.description,
    },
    event: {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      start: entity.start,
      end: entity.end,
      isPublic: entity.isPublic,
      isAllDay: entity.isAllDay,
    },
    createdBy: {
      id: user.id,
      name: user.name,
    },
  },
});
