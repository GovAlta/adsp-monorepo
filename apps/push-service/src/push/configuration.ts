export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^[a-zA-Z0-9-_ ]{1,50}$': {
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
        webhooks: {
          type: 'array',
          items: {
            id: { type: 'string' },
            name: { type: 'string' },
            url: { type: 'string' },
            targetId: { type: 'string' },
            intervalSeconds: { type: 'number' },
            description: { type: 'string' },
            eventTypes: {
              type: 'array',
              items: {
                id: { type: 'string' },
              },
            },
          },
        },
        subscriberRoles: { type: 'array', items: { type: 'string' } },
        publicSubscribe: { type: 'boolean' },
      },
      required: ['id', 'name'],
    },
  },
  additionalProperties: false,
};
