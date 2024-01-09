export const configurationSchema = {
  type: 'object',
  properties: {
    definitions: {
      type: 'object',
    },
    queues: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9-_ ]{1,50}:[a-zA-Z0-9-_ ]{1,50}$': {
          type: 'object',
          properties: {
            namespace: {
              type: 'string',
              pattern: '^[a-zA-Z0-9-_ ]{1,50}$',
            },
            name: {
              type: 'string',
              pattern: '^[a-zA-Z0-9-_ ]{1,50}$',
            },
            displayName: {
              type: ['string', 'null'],
            },
            context: {
              type: 'object',
              additionalProperties: {
                oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
              },
            },
            assignerRoles: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            workerRoles: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          required: ['namespace', 'name', 'context', 'assignerRoles', 'workerRoles'],
        },
      },
      additionalProperties: false,
    },
  },
};
