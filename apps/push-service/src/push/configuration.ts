import { Stream, Webhook } from './types';

export const configurationSchema = {
  type: 'object',
  properties: {
    webhooks: {
      type: ['object', 'null'],
      patternProperties: {
        '^[a-zA-Z0-9-_ ]{1,50}$': {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            url: { type: 'string' },
            events: {
              type: ['array', 'null'],
              items: {
                type: 'object',
                properties: {
                  namespace: { type: 'string' },
                  name: { type: 'string' },
                  map: {
                    type: 'object',
                    additionalProperties: {
                      type: 'string',
                    },
                  },
                  criteria: {
                    type: 'object',
                    properties: {
                      correlationId: { type: 'string' },
                      context: {
                        type: 'object',
                        additionalProperties: true,
                      },
                    },
                  },
                },
                required: ['namespace', 'name'],
              },
            },
            targetId: { type: 'string' },
            intervalMinutes: { type: 'number' },
            eventTypes: {
              type: ['array', 'null'],
              items: {
                type: 'object',
                properties: { id: { type: 'string' } },
                required: ['id'],
              },
            },
          },
          required: ['id', 'name', 'url'],
        },
      },
    },
  },
  additionalProperties: {
    type: 'object',
    properties: {
      id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
      name: { type: 'string' },
      description: { type: ['string', 'null'] },
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            namespace: { type: 'string' },
            name: { type: 'string' },
            map: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
            },
            criteria: {
              type: 'object',
              properties: {
                correlationId: { type: 'string' },
                context: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
            },
          },
          required: ['namespace', 'name'],
        },
      },
      subscriberRoles: { type: 'array', items: { type: 'string' } },
      publicSubscribe: { type: 'boolean' },
    },
    required: ['id', 'name'],
  },
};

export type PushServiceConfiguration = Record<string, Stream> & { webhooks: Record<string, Webhook> };
