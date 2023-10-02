import type { AdspId, DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';

export const webhookTriggered = (
  tenantId: AdspId,
  URL: string,
  targetId: string,
  EventList: { id: string }[],
  name: string,
  callStatus: string,
  callStatusCode: number,
  callDateTime: Date,
  callResponseTime: number
): DomainEvent => ({
  name: 'webhook-triggered',
  timestamp: new Date(),
  tenantId,
  correlationId: `${name}`,
  context: {
    name,
  },
  payload: {
    name,
    tenantId,
    targetId,
    URL,
    EventList,
    callStatus,
    callStatusCode,
    callDateTime,
    callResponseTime,
  },
});

export const WebhookTriggeredDefinition: DomainEventDefinition = {
  name: 'webhook-triggered',
  description: 'Signalled when a webhook is triggered.',
  payloadSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      tenantId: {
        type: 'object',
      },
      targetId: {
        type: 'string',
      },
      URL: {
        type: 'string',
      },
      EventList: {
        type: 'array',
        properties: {
          id: { type: 'string' },
        },
      },
      callStatus: {
        type: 'string',
      },
      callStatusCode: {
        type: 'number',
      },
      callDateTime: {
        type: 'string',
      },
      callResponseTime: {
        type: 'number',
      },
    },
    required: ['name', 'updatedBy'],
  },
};
