import type { DomainEventDefinition } from '@abgov/adsp-service-sdk';

export const CronJobTriggeredEventDefinition: DomainEventDefinition = {
  name: 'cron-job-triggered',
  description: 'Signalled when a cron job is triggered.',
  payloadSchema: {
    type: 'object',
    properties: {
      namespace: { type: 'string' },
      name: { type: 'string' },
      data: { type: ['object', 'null'] },
      correlationId: { type: ['string', 'null'] },
      context: { type: ['object', 'null'] },
      response: {
        type: 'object',
        properties: {
          status: {
            type: ['string', 'null'],
          },
          statusCode: {
            type: ['number', 'null'],
          },
          timestamp: {
            type: ['string', 'null'],
          },
        },
      },
      responseTime: {
        type: 'number',
      },
    },
    required: [],
  },
};
