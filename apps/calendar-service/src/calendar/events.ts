import { DomainEventDefinition } from '@abgov/adsp-service-sdk';

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

export const CalendarEventCreatedDefinition: DomainEventDefinition = {
  name: 'calendar-event-created',
  description: 'Signalled when a calendar event is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      calendar: {
        name: {
          type: 'string',
        },
      },
      createdBy: userSchema,
    },
  },
};

export const CalendarEventUpdatedDefinition: DomainEventDefinition = {
  name: 'calendar-event-updated',
  description: 'Signalled when a calendar event is updated.',
  payloadSchema: {

    updatedBy: userSchema,
  },
};

export const CalendarEventDeletedDefinition: DomainEventDefinition = {
  name: 'calendar-event-deleted',
  description: 'Signalled when a calendar event is deleted.',
  payloadSchema: {

    deletedBy: userSchema,
  },
};
